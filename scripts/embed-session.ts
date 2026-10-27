import path from "node:path";
import { readFileSync } from "node:fs";

process.env.OMP_NUM_THREADS ??= "1";
process.env.ORT_NUM_THREADS ??= "1";
import { decodeStoredIndex, type EmbeddingIndex } from "../lib/embedding-math.ts";
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_POOLING, EMBEDDING_QUERY_PREFIX } from "../lib/semantic-config.ts";
import { textForEmbedding } from "../lib/search.ts";
import { hasVector, installSemanticIndex, rememberVector, semanticReady } from "./rank-observed.ts";

type Extractor = (
  texts: string | string[],
  options: { pooling: "cls"; normalize: true },
) => Promise<{ data: Float32Array; dims: number[] }>;

let extractorPromise: Promise<Extractor> | null = null;
let index: EmbeddingIndex | null = null;

function storedIndex(): EmbeddingIndex {
  if (!index) {
    const stored = JSON.parse(readFileSync(path.resolve("public/embeddings/use-cases.json"), "utf8"));
    index = decodeStoredIndex(stored);
  }
  return index;
}

async function extractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.localModelPath = path.resolve("vendor/models");
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      const created = await pipeline("feature-extraction", EMBEDDING_MODEL, {
        dtype: EMBEDDING_DTYPE,
        session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
      });
      return created as unknown as Extractor;
    })();
  }
  return extractorPromise;
}

export async function ensureEmbedded(queries: string[]): Promise<void> {
  const current = storedIndex();
  if (!semanticReady()) installSemanticIndex(current, new Map());
  const missing = [...new Set(queries.map((query) => textForEmbedding(query)).filter((text) => text && !hasVector(text)))];
  if (missing.length === 0) return;
  const model = await extractor();
  // Match the browser, which embeds one query. Batched CLS pooling in this
  // runtime mixes in the other sentences, so a batch would not be what users see.
  for (const text of missing) {
    const output = await model(EMBEDDING_QUERY_PREFIX + text, { pooling: EMBEDDING_POOLING, normalize: true });
    const width = output.dims[output.dims.length - 1];
    const data = output.data;
    // The runtime can reuse this buffer on the next call. Copy before storing.
    const view = data.length === width ? data : data.subarray(data.length - width);
    rememberVector(text, Float32Array.from(view));
  }
}

export async function embedTiming(sample: string): Promise<{ loadMs: number; queryMs: number }> {
  const started = performance.now();
  const model = await extractor();
  const loadMs = performance.now() - started;
  const queryStarted = performance.now();
  await model(EMBEDDING_QUERY_PREFIX + sample, { pooling: EMBEDDING_POOLING, normalize: true });
  return { loadMs, queryMs: performance.now() - queryStarted };
}

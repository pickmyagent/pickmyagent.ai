import { decodeStoredIndex, scoresForVector, type StoredEmbeddingIndex } from "./embedding-math.ts";
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_POOLING, EMBEDDING_QUERY_PREFIX } from "./semantic-config.ts";
import { rankCatalogQuery, textForEmbedding } from "./search.ts";
import type { Category, Tool, UseCase } from "./types.ts";
import type { RankedSearch } from "./search.ts";

type Extractor = (
  text: string,
  options: { pooling: "cls"; normalize: true },
) => Promise<{ data: Float32Array }>;

type CatalogSlice = { tools: Tool[]; useCases: UseCase[]; categories: Category[] };

let extractorPromise: Promise<Extractor> | null = null;
let indexPromise: Promise<ReturnType<typeof decodeStoredIndex>> | null = null;
let embedChain: Promise<unknown> = Promise.resolve();

function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const run = embedChain.then(work, work);
  embedChain = run.then(() => undefined, () => undefined);
  return run;
}

export function prefetchEmbedder(): Promise<void> {
  return Promise.all([loadExtractor(), loadIndex()]).then(() => undefined);
}

async function loadExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowRemoteModels = false;
      env.allowLocalModels = true;
      env.localModelPath = "/models/";
      env.backends.onnx.wasm.wasmPaths = {
        mjs: "/onnx/ort-wasm-simd-threaded.asyncify.mjs",
        wasm: "/onnx/ort-wasm-simd-threaded.asyncify.wasm",
      };
      const extractor = await pipeline("feature-extraction", EMBEDDING_MODEL, { dtype: EMBEDDING_DTYPE });
      return extractor as unknown as Extractor;
    })();
  }
  return extractorPromise;
}

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch("/embeddings/use-cases.json")
      .then((response) => {
        if (!response.ok) throw new Error("embedding index missing");
        return response.json() as Promise<StoredEmbeddingIndex>;
      })
      .then((stored) => decodeStoredIndex(stored));
  }
  return indexPromise;
}

/** Lexical results are already on screen. This replaces them once meaning scores exist. */
export async function refineQuery(query: string, catalog: CatalogSlice): Promise<RankedSearch | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const [extractor, index] = await Promise.all([loadExtractor(), loadIndex()]);
  return exclusive(async () => {
    const output = await extractor(EMBEDDING_QUERY_PREFIX + textForEmbedding(trimmed), { pooling: EMBEDDING_POOLING, normalize: true });
    const data = output.data;
    const view = data.length === index.dim ? data : data.subarray(data.length - index.dim);
    const vector = Float32Array.from(view);
    return rankCatalogQuery(trimmed, catalog, scoresForVector(index, vector));
  });
}

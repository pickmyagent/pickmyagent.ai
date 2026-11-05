import { capabilityCosines, decodeCapabilityIndex, decodeStoredIndex, scoresForVector, type StoredCapabilityIndex, type StoredEmbeddingIndex } from "./embedding-math.ts";
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_POOLING, EMBEDDING_QUERY_PREFIX } from "./semantic-config.ts";
import { rankCatalogQuery, textForEmbedding, type CapabilityCosine } from "./search.ts";
import { wasmSessionPlan } from "./wasm-runtime.ts";
import type { Category, Tool, UseCase } from "./types.ts";
import type { RankedSearch } from "./search.ts";

type Extractor = (
  text: string,
  options: { pooling: "cls"; normalize: true },
) => Promise<{ data: Float32Array }>;

type CatalogSlice = { tools: Tool[]; useCases: UseCase[]; categories: Category[] };

type RemoteEnv = {
  allowRemoteModels: boolean;
  allowLocalModels: boolean;
  remoteHost: string;
  useBrowserCache: boolean;
  fetch: typeof fetch;
  backends: { onnx: { wasm: { wasmPaths: { mjs: string; wasm: string }; numThreads: number; proxy?: boolean } } };
};

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm";
const WASM_BASE = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.0-dev.20260914-8d85527a0/dist/";
const CACHE_NAME = "pickmyagent-embed-v1";
const INDEX_URL = "/embeddings/use-cases.json";
const CAPABILITY_URL = "/embeddings/capabilities.json";

let extractorPromise: Promise<Extractor> | null = null;
let indexPromise: Promise<ReturnType<typeof decodeStoredIndex>> | null = null;
let capabilityPromise: Promise<ReturnType<typeof decodeCapabilityIndex> | null> | null = null;
let embedChain: Promise<unknown> = Promise.resolve();

function exclusive<T>(work: () => Promise<T>): Promise<T> {
  const run = embedChain.then(work, work);
  embedChain = run.then(() => undefined, () => undefined);
  return run;
}

function sameOrigin(url: string): boolean {
  try {
    return new URL(url, location.origin).origin === location.origin;
  } catch {
    return false;
  }
}

/** Network first for the CDN. The index is cache-first so a repeat search does not hit this site. */
async function fetchWithCache(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init);
  const cache = typeof caches === "undefined" ? null : await caches.open(CACHE_NAME).catch(() => null);
  if (cache && sameOrigin(request.url)) {
    const cached = await cache.match(request);
    if (cached) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok && cache) await cache.put(request, response.clone()).catch(() => undefined);
    if (response.ok || !cache) return response;
    const cached = await cache.match(request);
    return cached ?? response;
  } catch (error) {
    if (cache) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    throw error;
  }
}

async function runtimeUrl(file: string): Promise<string> {
  const remote = `${WASM_BASE}${file}`;
  const cache = typeof caches === "undefined" ? null : await caches.open(CACHE_NAME).catch(() => null);
  try {
    const response = await fetch(remote);
    if (!response.ok) throw new Error(String(response.status));
    if (cache) await cache.put(remote, response.clone()).catch(() => undefined);
    return remote;
  } catch (error) {
    const cached = cache ? await cache.match(remote) : undefined;
    if (!cached) throw error;
    return URL.createObjectURL(await cached.blob());
  }
}

async function loadExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const remote = await import(
        /* webpackIgnore: true */
        /* turbopackIgnore: true */
        TRANSFORMERS_URL,
      );
      const env = remote.env as RemoteEnv;
      env.allowRemoteModels = true;
      env.allowLocalModels = false;
      env.remoteHost = "https://huggingface.co/";
      env.useBrowserCache = true;
      env.fetch = fetchWithCache;
      const plan = wasmSessionPlan({
        userAgent: navigator.userAgent,
        crossOriginIsolated: typeof crossOriginIsolated !== "undefined" && crossOriginIsolated,
      });
      const [mjs, wasm] = await Promise.all([
        runtimeUrl(`${plan.fileStem}.mjs`),
        runtimeUrl(`${plan.fileStem}.wasm`),
      ]);
      env.backends.onnx.wasm.wasmPaths = { mjs, wasm };
      // iOS Safari is not cross-origin isolated. The asyncify build and one
      // thread avoid a pthread session that throws and leaves lexical results.
      env.backends.onnx.wasm.numThreads = plan.numThreads;
      env.backends.onnx.wasm.proxy = plan.proxy;
      const extractor = await remote.pipeline("feature-extraction", EMBEDDING_MODEL, {
        dtype: EMBEDDING_DTYPE,
        device: "wasm",
      });
      return extractor as unknown as Extractor;
    })();
  }
  return extractorPromise;
}

function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetchWithCache(INDEX_URL)
      .then((response) => response.json() as Promise<StoredEmbeddingIndex>)
      .then((stored) => decodeStoredIndex(stored));
  }
  return indexPromise;
}

function loadCapabilities() {
  if (!capabilityPromise) {
    capabilityPromise = fetchWithCache(CAPABILITY_URL)
      .then((response) => (response.ok ? response.json() as Promise<StoredCapabilityIndex> : null))
      .then((stored) => (stored ? decodeCapabilityIndex(stored) : null))
      .catch(() => null);
  }
  return capabilityPromise;
}

/** Lexical results are already on screen. This replaces them once meaning scores exist. */
export async function refineQuery(query: string, catalog: CatalogSlice): Promise<RankedSearch | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  const [extractor, index, capabilities] = await Promise.all([loadExtractor(), loadIndex(), loadCapabilities()]);
  return exclusive(async () => {
    const output = await extractor(EMBEDDING_QUERY_PREFIX + textForEmbedding(trimmed), { pooling: EMBEDDING_POOLING, normalize: true });
    const data = output.data;
    const view = data.length === index.dim ? data : data.subarray(data.length - index.dim);
    const vector = Float32Array.from(view);
    const meaning: CapabilityCosine[] | undefined = capabilities
      ? capabilityCosines(capabilities, vector)
      : undefined;
    return rankCatalogQuery(trimmed, catalog, scoresForVector(index, vector), meaning);
  });
}

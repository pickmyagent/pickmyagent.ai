import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

process.env.OMP_NUM_THREADS ??= "1";
process.env.ORT_NUM_THREADS ??= "1";
import { env, pipeline } from "@huggingface/transformers";
import { encodeMatrix } from "../lib/embedding-math.ts";
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_POOLING, EMBEDDING_QUERY_PREFIX } from "../lib/semantic-config.ts";
import { correctedQuery } from "../lib/search.ts";
import { corpusHash, embeddingDocuments } from "./embedding-corpus.ts";

const MODEL = EMBEDDING_MODEL;
const DTYPE = EMBEDDING_DTYPE;

const OFF_DOMAIN = [
  "plan a wedding",
  "train my dog",
  "what's my business worth",
  "write a cookbook",
  "organize my garage",
  "bake a cake",
  "wheres a good wedding venue",
  "find a realtor for my house",
  "a lot of deals",
];

env.localModelPath = path.resolve("vendor/models");
env.allowRemoteModels = false;
env.allowLocalModels = true;

type Extractor = (
  texts: string | string[],
  options: { pooling: "cls"; normalize: true },
) => Promise<{ data: Float32Array; dims: number[] }>;

async function embedBatch(extractor: Extractor, texts: string[]): Promise<Float32Array[]> {
  const output = await extractor(texts, { pooling: EMBEDDING_POOLING, normalize: true });
  const dims = output.dims;
  const width = dims[dims.length - 1];
  const rows: Float32Array[] = [];
  for (let row = 0; row < texts.length; row += 1) {
    rows.push(output.data.slice(row * width, (row + 1) * width));
  }
  return rows;
}

const documents = embeddingDocuments();
const extractor = await pipeline("feature-extraction", MODEL, {
  dtype: DTYPE,
  session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
}) as unknown as Extractor;
const vectors: Float32Array[] = [];
// One sentence at a time. Batched CLS pooling in this runtime changes the vector
// with the other sentences in the batch, and the browser embeds one query.
for (let index = 0; index < documents.length; index += 1) {
  vectors.push(...await embedBatch(extractor, [documents[index].text]));
  if ((index + 1) % 100 === 0 || index + 1 === documents.length) {
    process.stdout.write(`\rembedded ${index + 1}/${documents.length}`);
  }
}
process.stdout.write("\n");

const dim = vectors[0]?.length ?? 0;
const flat = new Float32Array(vectors.length * dim);
vectors.forEach((vector, row) => flat.set(vector, row * dim));
const stored = {
  model: MODEL,
  dtype: DTYPE,
  dim,
  ids: documents.map((document) => document.id),
  matrix: encodeMatrix(flat),
  documents: documents.length,
  corpusHash: corpusHash(documents),
};
const { decodeStoredIndex } = await import("../lib/embedding-math.ts");
const decoded = decodeStoredIndex(stored);
for (let row = 0; row < documents.length; row += 1) {
  let norm = 0;
  for (let column = 0; column < dim; column += 1) {
    const value = decoded.matrix[row * dim + column];
    if (!Number.isFinite(value)) throw new Error(`non-finite embedding at ${row}`);
    norm += value * value;
  }
  const length = Math.sqrt(norm);
  if (length < 0.95 || length > 1.05) throw new Error(`row ${row} norm ${length}`);
}
mkdirSync(path.resolve("public/embeddings"), { recursive: true });
writeFileSync(path.resolve("public/embeddings/use-cases.json"), JSON.stringify(stored));
console.log(`wrote public/embeddings/use-cases.json (${documents.length} docs, dim ${dim}, ${(stored.matrix.length / 1e6).toFixed(2)} MB base64)`);

function maxDot(query: Float32Array, ids: string[], matrix: Float32Array[], onlyId?: string): { id: string; cosine: number } {
  let bestId = "";
  let best = -1;
  for (let row = 0; row < ids.length; row += 1) {
    if (onlyId && ids[row] !== onlyId) continue;
    let dot = 0;
    const vector = matrix[row];
    for (let column = 0; column < query.length; column += 1) dot += query[column] * vector[column];
    if (dot > best) {
      best = dot;
      bestId = ids[row];
    }
  }
  return { id: bestId, cosine: best };
}

const sameConcept: number[] = [];
for (let row = 0; row < documents.length; row += 1) {
  if (documents[row].kind !== "seed") continue;
  let best = -1;
  for (let other = 0; other < documents.length; other += 1) {
    if (other === row || documents[other].id !== documents[row].id) continue;
    let dot = 0;
    for (let column = 0; column < dim; column += 1) dot += vectors[row][column] * vectors[other][column];
    if (dot > best) best = dot;
  }
  if (best > 0) sameConcept.push(best);
}
sameConcept.sort((a, b) => a - b);
const percentile = (list: number[], ratio: number) => list[Math.min(list.length - 1, Math.floor(list.length * ratio))] ?? 0;
console.log(`leave-one-out same-concept cosine p10 ${percentile(sameConcept, 0.1).toFixed(3)} p50 ${percentile(sameConcept, 0.5).toFixed(3)} n ${sameConcept.length}`);

const offVectors = await embedBatch(extractor, OFF_DOMAIN.map((query) => EMBEDDING_QUERY_PREFIX + correctedQuery(query)));
OFF_DOMAIN.forEach((query, index) => {
  const hit = maxDot(offVectors[index], stored.ids, vectors);
  console.log(`off-domain ${hit.cosine.toFixed(3)} ${hit.id} :: ${query}`);
});

const headphone = await embedBatch(extractor, [EMBEDDING_QUERY_PREFIX + correctedQuery("price comparison for headphones")]);
const phoneHit = maxDot(headphone[0], stored.ids, vectors);
console.log(`control ${phoneHit.cosine.toFixed(3)} ${phoneHit.id} :: price comparison for headphones`);

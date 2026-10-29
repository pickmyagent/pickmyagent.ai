import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

process.env.OMP_NUM_THREADS ??= "1";
process.env.ORT_NUM_THREADS ??= "1";
import { env, pipeline } from "@huggingface/transformers";
import { encodeInt8Matrix } from "../lib/embedding-math.ts";
import { projectUnit, quantizeUnit, CAPABILITY_DIM } from "../lib/projection.ts";
import { EMBEDDING_DTYPE, EMBEDDING_MODEL, EMBEDDING_POOLING } from "../lib/semantic-config.ts";
import type { Tool } from "../lib/types.ts";

env.localModelPath = path.resolve("vendor/models");
env.allowRemoteModels = false;
env.allowLocalModels = true;

type Extractor = (
  text: string,
  options: { pooling: "cls"; normalize: true },
) => Promise<{ data: Float32Array; dims: number[] }>;

const catalog = JSON.parse(readFileSync(path.resolve("content/catalog.json"), "utf8")) as { tools: Tool[] };
const docs: { id: string; text: string }[] = [];
for (const tool of catalog.tools) {
  if (tool.generalPurpose || tool.status !== "published") continue;
  (tool.capabilities ?? []).forEach((text, index) => {
    if (text.toLowerCase().startsWith("work from ")) return;
    docs.push({ id: `${tool.slug}#${index}`, text });
  });
}

const extractor = await pipeline("feature-extraction", EMBEDDING_MODEL, {
  dtype: EMBEDDING_DTYPE,
  session_options: { intraOpNumThreads: 1, interOpNumThreads: 1 },
}) as unknown as Extractor;

const rows: Int8Array[] = [];
for (let index = 0; index < docs.length; index += 1) {
  const output = await extractor(docs[index].text, { pooling: EMBEDDING_POOLING, normalize: true });
  const width = output.dims[output.dims.length - 1];
  const data = output.data;
  const view = data.length === width ? data : data.subarray(data.length - width);
  rows.push(quantizeUnit(projectUnit(Float32Array.from(view))));
  if ((index + 1) % 100 === 0 || index + 1 === docs.length) {
    process.stdout.write(`\rembedded ${index + 1}/${docs.length}`);
  }
}
process.stdout.write("\n");

const flat = new Int8Array(rows.length * CAPABILITY_DIM);
rows.forEach((row, index) => flat.set(row, index * CAPABILITY_DIM));
const stored = {
  model: EMBEDDING_MODEL,
  dim: CAPABILITY_DIM,
  ids: docs.map((doc) => doc.id),
  matrix: encodeInt8Matrix(flat),
};
const target = path.resolve("public/embeddings/capabilities.json");
mkdirSync(path.dirname(target), { recursive: true });
const body = JSON.stringify(stored);
writeFileSync(target, body);
const gzip = gzipSync(Buffer.from(body));
const jobs = gzipSync(readFileSync(path.resolve("public/embeddings/use-cases.json")));
console.log(`capabilities ${docs.length} docs, ${body.length} bytes, ${gzip.length} gzip`);
console.log(`jobs+capabilities gzip ${jobs.length + gzip.length}`);

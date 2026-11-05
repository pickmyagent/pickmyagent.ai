import { existsSync, readFileSync } from "node:fs";
import { capabilityCosines, decodeCapabilityIndex, scoresForVector, type CapabilityIndex, type EmbeddingIndex } from "../lib/embedding-math.ts";
import { rankCatalogQuery, textForEmbedding, type CapabilityCosine, type SemanticScore } from "../lib/search.ts";
import type { Category, Tool, UseCase } from "../lib/types.ts";

type CatalogSlice = { tools: Tool[]; useCases: UseCase[]; categories: Category[] };

let index: EmbeddingIndex | null = null;
const vectors = new Map<string, Float32Array>();

export function semanticReady(): boolean {
  return index !== null;
}

export function installSemanticIndex(next: EmbeddingIndex, embedded: Map<string, Float32Array>): void {
  index = next;
  vectors.clear();
  for (const [text, vector] of embedded) vectors.set(text, vector);
}

export function rememberVector(text: string, vector: Float32Array): void {
  vectors.set(text, vector);
}

export function hasVector(text: string): boolean {
  return vectors.has(text);
}

export function observedScores(query: string): SemanticScore[] | undefined {
  if (!index) return undefined;
  const vector = vectors.get(textForEmbedding(query));
  if (!vector) return undefined;
  return scoresForVector(index, vector);
}

let capabilityIndex: CapabilityIndex | null | undefined;

function loadCapabilityIndex(): CapabilityIndex | null {
  if (capabilityIndex !== undefined) return capabilityIndex;
  const file = new URL("../public/embeddings/capabilities.json", import.meta.url);
  if (!existsSync(file)) {
    capabilityIndex = null;
    return null;
  }
  capabilityIndex = decodeCapabilityIndex(JSON.parse(readFileSync(file, "utf8")));
  return capabilityIndex;
}

export function observedCapabilityScores(query: string): CapabilityCosine[] | undefined {
  const stored = loadCapabilityIndex();
  if (!stored) return undefined;
  const vector = vectors.get(textForEmbedding(query));
  if (!vector) return undefined;
  return capabilityCosines(stored, vector);
}

export function rankObserved(query: string, catalog: CatalogSlice) {
  return rankCatalogQuery(query, catalog, observedScores(query), observedCapabilityScores(query));
}

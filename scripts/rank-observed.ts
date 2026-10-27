import { scoresForVector, type EmbeddingIndex } from "../lib/embedding-math.ts";
import { rankCatalogQuery, textForEmbedding, type SemanticScore } from "../lib/search.ts";
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

export function rankObserved(query: string, catalog: CatalogSlice) {
  return rankCatalogQuery(query, catalog, observedScores(query));
}

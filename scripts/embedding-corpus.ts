import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CONCEPTS } from "../lib/concepts.ts";
import { correctedQuery, labelConceptForSeed } from "../lib/search.ts";
import type { UseCase } from "../lib/types.ts";
import { SEEDS } from "./natural-seeds.ts";

export type CorpusDocument = { id: string; text: string; kind: "profile" | "seed" };

export function embeddingDocuments(): CorpusDocument[] {
  const catalog = JSON.parse(readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8")) as {
    useCases: UseCase[];
  };
  const documents: CorpusDocument[] = [];
  const seen = new Set<string>();
  const add = (id: string, text: string, kind: CorpusDocument["kind"]) => {
    const cleaned = text.replace(/\s+/g, " ").trim();
    if (!cleaned) return;
    const key = `${id}\n${cleaned.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    documents.push({ id, text: cleaned, kind });
  };
  for (const concept of CONCEPTS) {
    const useCase = catalog.useCases.find((item) => item.slug === concept.useCase);
    const profile = [
      useCase?.title,
      useCase?.summary,
      useCase?.intro,
      useCase?.jobPhrase,
      concept.phrases.join(". "),
    ].filter(Boolean).join(". ");
    add(concept.id, profile, "profile");
  }
  for (const [useCase, seeds] of Object.entries(SEEDS)) {
    for (const seed of seeds) {
      const id = labelConceptForSeed(seed, useCase);
      add(id, seed, "seed");
      const corrected = correctedQuery(seed);
      if (corrected.toLowerCase() !== seed.toLowerCase()) add(id, corrected, "seed");
    }
  }
  return documents;
}

export function corpusHash(documents: CorpusDocument[]): string {
  const hash = createHash("sha256");
  for (const document of documents) hash.update(`${document.id}\n${document.text}\n`);
  return hash.digest("hex");
}

import { CONCEPTS } from "../lib/concepts.ts";
import { CANONICAL_REAL_ESTATE } from "../lib/real-estate-match.ts";
import { grammarProblems } from "./grammar-gate.ts";
import { matchTagsForConcept, rankCatalogQuery } from "../lib/search.ts";
import type { Catalog, Tool } from "../lib/types.ts";
import { FOUNDER_QUERY, HELD_OUT_REAL_ESTATE, SEEDS } from "./natural-seeds.ts";

/**
 * Paraphrase gate.
 * Seeds are natural phrasings (at least 15 per use case). Templates sit on top.
 * The held-out real-estate set is graded separately and is not used to tune phrases one by one.
 */

export { FOUNDER_QUERY };

const REAL_ESTATE = new Set<string>([
  ...CANONICAL_REAL_ESTATE,
  "find-land",
  "find-off-market",
  "rank-property-deals",
  "listing-videos",
  "real-estate",
]);

const TEMPLATES: Array<(seed: string) => string> = [
  (seed) => `can you ${seed}`,
  (seed) => `please ${seed}`,
  (seed) => `${seed}"`,
  (seed) => `I need an AI to ${seed}`,
];

export type Paraphrase = {
  query: string;
  useCase: string;
  realEstate: boolean;
  kind: "seed" | "wrapped" | "held-out";
};

function row(query: string, useCase: string, kind: Paraphrase["kind"]): Paraphrase {
  return {
    query: query.replace(/\s+/g, " ").trim(),
    useCase,
    realEstate: REAL_ESTATE.has(useCase),
    kind,
  };
}

export function buildSeeds(): Paraphrase[] {
  return Object.entries(SEEDS).flatMap(([useCase, seeds]) => seeds.map((query) => row(query, useCase, "seed")));
}

export function buildWrapped(): Paraphrase[] {
  return Object.entries(SEEDS).flatMap(([useCase, seeds]) =>
    seeds.flatMap((seed) => TEMPLATES.map((template) => row(template(seed), useCase, "wrapped"))),
  );
}

export function buildHeldOut(): Paraphrase[] {
  return HELD_OUT_REAL_ESTATE.map((item) => row(item.query, item.useCase, "held-out"));
}

export function buildParaphrases(): Paraphrase[] {
  return [...buildSeeds(), ...buildWrapped(), ...buildHeldOut()];
}

const GENERIC_INTRO = /^AI assistants\b/;

function specialistOnDomain(tool: Tool, useCaseSlug: string, catalog: Catalog): boolean {
  const concept = CONCEPTS.find((entry) => entry.useCase === useCaseSlug);
  if (!concept || concept.categories.length === 0) return false;
  const tags = matchTagsForConcept(concept, catalog.useCases);
  if (!tool.useCaseTags.some((tag) => tags.includes(tag))) return false;
  return tool.categories.every((category) => concept.categories.includes(category));
}

function availableSpecialists(catalog: Catalog, useCaseSlug: string): Tool[] {
  return catalog.tools.filter((tool) => {
    if (tool.generalPurpose || tool.status !== "published") return false;
    return specialistOnDomain(tool, useCaseSlug, catalog);
  });
}

export type ParaphraseGrade = {
  query: string;
  useCase: string;
  realEstate: boolean;
  kind: Paraphrase["kind"];
  got: string | null;
  intro: string;
  header: string;
  top: string[];
  pass: boolean;
  reason: string;
};

export type RateBucket = { useCase: string; total: number; passed: number; rate: number };

export type ParaphraseReport = {
  grades: ParaphraseGrade[];
  problems: string[];
  heldOutMisses: string[];
  passRate: number;
  seedPassRate: number;
  wrappedPassRate: number;
  heldOutPassRate: number;
  precisionAt3: number;
  heldOutPrecisionAt3: number;
  byUseCase: RateBucket[];
  realEstateCount: number;
  seedCount: number;
  wrappedCount: number;
  heldOutCount: number;
};

function gradeItems(items: Paraphrase[], catalog: Catalog, collectProblems: boolean): {
  grades: ParaphraseGrade[];
  problems: string[];
  passed: number;
  hits: number;
  slots: number;
  byUseCase: Map<string, { total: number; passed: number }>;
} {
  const grades: ParaphraseGrade[] = [];
  const problems: string[] = [];
  let passed = 0;
  let hits = 0;
  let slots = 0;
  const byUseCase = new Map<string, { total: number; passed: number }>();
  for (const item of items) {
    const ranked = rankCatalogQuery(item.query, catalog);
    const got = ranked.useCases[0]?.slug ?? null;
    const topTools = ranked.tools.slice(0, 3);
    const specialists = availableSpecialists(catalog, item.useCase);
    const offDomain = topTools.filter((tool) => {
      if (tool.generalPurpose) return false;
      const source = catalog.tools.find((entry) => entry.slug === tool.slug);
      return !source || !specialistOnDomain(source, item.useCase, catalog);
    });
    const generic = GENERIC_INTRO.test(ranked.intro);
    const headerProblems = grammarProblems(ranked.lead, "header");
    const reasons: string[] = [];
    if (got !== item.useCase) reasons.push(`ranked ${got ?? "none"}`);
    if (generic) reasons.push("generic intro");
    if (offDomain.length > 0) reasons.push(`off-domain ${offDomain.map((tool) => tool.name).join(", ")}`);
    if (specialists.length === 0 && topTools.some((tool) => !tool.generalPurpose)) {
      reasons.push("specialist on an assistant-only job");
    }
    if (item.kind === "seed" && headerProblems.length > 0) reasons.push(`header ${headerProblems.join(", ")}`);
    const cloudFirst = item.useCase === "cma-comps"
      ? ranked.tools.find((tool) => !tool.generalPurpose)?.slug === "cloud-cma"
      : true;
    if (item.useCase === "cma-comps" && !cloudFirst) reasons.push("Cloud CMA is not first");
    const pass = reasons.length === 0;
    if (pass) passed += 1;
    else if (collectProblems && problems.length < 40) problems.push(`${item.useCase}: ${item.query} → ${reasons.join("; ")}`);
    const bucket = byUseCase.get(item.useCase) ?? { total: 0, passed: 0 };
    bucket.total += 1;
    if (pass) bucket.passed += 1;
    byUseCase.set(item.useCase, bucket);
    for (const tool of topTools) {
      slots += 1;
      const source = catalog.tools.find((entry) => entry.slug === tool.slug);
      const onDomain = Boolean(source && !tool.generalPurpose && specialistOnDomain(source, item.useCase, catalog));
      if (onDomain || (tool.generalPurpose && specialists.length < 3)) hits += 1;
    }
    grades.push({
      query: item.query,
      useCase: item.useCase,
      realEstate: item.realEstate,
      kind: item.kind,
      got,
      intro: ranked.intro,
      header: ranked.lead,
      top: topTools.map((tool) => tool.name),
      pass,
      reason: reasons.join("; "),
    });
  }
  return { grades, problems, passed, hits, slots, byUseCase };
}

function rateOf(passed: number, total: number): number {
  return total === 0 ? 0 : passed / total;
}

export function gradeParaphrases(catalog: Catalog): ParaphraseReport {
  const seeds = buildSeeds();
  const wrapped = buildWrapped();
  const heldOut = buildHeldOut();
  const problems: string[] = [];
  const counts = new Map<string, number>();
  for (const item of seeds) counts.set(item.useCase, (counts.get(item.useCase) ?? 0) + 1);
  const useCases = new Set(CONCEPTS.map((concept) => concept.useCase));
  for (const useCase of useCases) {
    const total = counts.get(useCase) ?? 0;
    if (total < 15) problems.push(`${useCase}: only ${total} natural seeds`);
  }
  if (!seeds.some((item) => item.query === FOUNDER_QUERY)) {
    problems.push("founder demo query is missing from the seed set");
  }
  if (heldOut.length < 150) problems.push(`held-out real estate set has ${heldOut.length} queries`);

  const seedGrade = gradeItems(seeds, catalog, true);
  const wrappedGrade = gradeItems(wrapped, catalog, true);
  const heldGrade = gradeItems(heldOut, catalog, false);
  problems.push(...seedGrade.problems, ...wrappedGrade.problems);
  const heldOutMisses = heldGrade.grades.filter((item) => !item.pass).map((item) => `${item.useCase}: ${item.query} → ${item.reason}`);

  const byUseCase = [...seedGrade.byUseCase.entries()]
    .map(([useCase, bucket]) => ({
      useCase,
      total: bucket.total,
      passed: bucket.passed,
      rate: rateOf(bucket.passed, bucket.total),
    }))
    .sort((a, b) => a.rate - b.rate || a.useCase.localeCompare(b.useCase));

  const realEstateSeeds = seeds.filter((item) => item.realEstate).length;
  return {
    grades: [...seedGrade.grades, ...wrappedGrade.grades, ...heldGrade.grades],
    problems,
    heldOutMisses,
    passRate: rateOf(seedGrade.passed, seeds.length),
    seedPassRate: rateOf(seedGrade.passed, seeds.length),
    wrappedPassRate: rateOf(wrappedGrade.passed, wrapped.length),
    heldOutPassRate: rateOf(heldGrade.passed, heldOut.length),
    precisionAt3: rateOf(seedGrade.hits, seedGrade.slots),
    heldOutPrecisionAt3: rateOf(heldGrade.hits, heldGrade.slots),
    byUseCase,
    realEstateCount: realEstateSeeds + heldOut.length,
    seedCount: seeds.length,
    wrappedCount: wrapped.length,
    heldOutCount: heldOut.length,
  };
}

export function paraphraseProblems(catalog: Catalog): string[] {
  const report = gradeParaphrases(catalog);
  const problems = [...report.problems];
  if (report.seedPassRate < 1) {
    problems.unshift(
      `seed pass rate ${report.seedPassRate.toFixed(3)} (${report.byUseCase.filter((item) => item.passed === item.total).length}/${report.byUseCase.length} use cases clean)`,
    );
  }
  if (report.wrappedPassRate < 1) {
    problems.unshift(`wrapped template pass rate ${report.wrappedPassRate.toFixed(3)}`);
  }
  return problems;
}

export function paraphraseSummary(catalog: Catalog): string {
  const report = gradeParaphrases(catalog);
  const lines = [
    `Seed pass rate ${(report.seedPassRate * 100).toFixed(1)}% (${report.seedCount} natural seeds). Wrapped pass rate ${(report.wrappedPassRate * 100).toFixed(1)}% (${report.wrappedCount}).`,
    `Held-out real estate pass rate ${(report.heldOutPassRate * 100).toFixed(1)}% (${report.heldOutCount}). Seed precision@3 ${report.precisionAt3.toFixed(3)}. Held-out precision@3 ${report.heldOutPrecisionAt3.toFixed(3)}.`,
    "",
    "Per-use-case seed pass rate:",
  ];
  for (const row of [...report.byUseCase].sort((a, b) => a.useCase.localeCompare(b.useCase))) {
    lines.push(`- ${row.useCase}: ${(row.rate * 100).toFixed(1)}% (${row.passed}/${row.total})`);
  }
  if (report.heldOutMisses.length > 0) {
    lines.push("", "Held-out misses:", ...report.heldOutMisses.slice(0, 40).map((item) => `- ${item}`));
  }
  return lines.join("\n");
}

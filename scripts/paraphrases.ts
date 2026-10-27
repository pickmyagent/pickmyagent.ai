import { CONCEPTS, type Concept } from "../lib/concepts.ts";
import { CANONICAL_REAL_ESTATE } from "../lib/real-estate-match.ts";
import { matchTagsForConcept, rankCatalogQuery } from "../lib/search.ts";
import type { Catalog, Tool } from "../lib/types.ts";

/**
 * Paraphrase gate. Every use case gets at least 25 wording variants.
 * A known job fails when the intro is the generic assistant line, the
 * winning use case changes, or an off-domain specialist lands in the top 3.
 */

export const FOUNDER_QUERY = 'pull house comparisons for me to make a CMA"';

const REAL_ESTATE = new Set<string>([
  ...CANONICAL_REAL_ESTATE,
  "find-land",
  "find-off-market",
  "rank-property-deals",
  "listing-videos",
  "real-estate",
]);

const SKIP_PHRASE = new Set([
  "real estate",
  "cash flow",
  "sphere of influence",
  "listing photos",
]);

const EXTRA: Record<string, string[]> = {
  "cma-comps": [
    FOUNDER_QUERY,
    "pull house comparisons",
    "pull house comparsions",
    "home comps for this listing",
    "property comps",
    "BPO for this house",
    "broker price opinion",
    "comparable sales",
    "similar sales for the listing",
    "recently sold homes",
    "price a listing",
    "pricing a listing",
  ],
  "listing-copy": [
    "write an MLS listing description",
    "lisitng description for the house",
    "MLS remarks for my listing",
    "property description for the MLS",
  ],
  "listing-photos": [
    "virtually stage this listing photo",
    "edit my listing photos",
    "photo editing for a listing",
    "day to dusk on the listing photo",
  ],
  "listing-videos": [
    "edit my listing video",
    "make a house tour video",
    "turn listing photos into a video",
    "property reel for this home",
  ],
  "realtor-follow-up": [
    "follow up with my buyers",
    "nurture sellers after the showing",
    "stay in touch with past clients",
    "buyer follow-up drip",
  ],
  "real-estate-crm": [
    "CRM for my buyers",
    "realtor CRM",
    "real estate CRM for sellers",
  ],
  "showing-scheduling": [
    "scheduel an open house",
    "schedule a showing for this house",
    "showing appointment for the listing",
    "lockbox for the open house",
  ],
  "transaction-coordination": [
    "transaction coordinator for this closing",
    "seller disclosure for the house",
    "discloser for the closing",
    "purchase agreement for the home",
  ],
  "market-reports": [
    "neighboorhood market update for clients",
    "housing market update",
    "market stats for the neighborhood",
  ],
  "realtor-prospecting": [
    "expired listings in my farm",
    "expireds and a farm area",
    "farming a neighborhood",
    "sphere of influence",
    "circle prospecting",
  ],
  "agent-social": [
    "social media for realtors",
    "instagram for realtors",
    "listing posts for my real estate page",
    "realtor social calendar",
  ],
  "property-management": [
    "maintanance request for a tenant",
    "collect rent from tenants",
    "manage my rentals",
    "lease renewal for the tenant",
  ],
  "find-land": [
    "vacant land in florida",
    "find a parcel",
    "acreage with zoning",
    "vacant lot",
  ],
  "find-off-market": [
    "fsbo near me",
    "for sale by owner homes",
    "skip trace an owner",
    "motivated sellers",
  ],
  "rank-property-deals": [
    "rank rental properties by cash flow",
    "cap rate for this rental",
    "ARV after repair value",
    "rental comps for the property",
    "score houses to flip",
  ],
  bookkeeping: [
    "help with Ai quickbooks",
    "find and agent to help automate my quickbooks clean up for my small business",
    "qbo cleanup",
    "quikbooks cleanup",
    "clean up my books",
    "bookeeping for my shop",
    "reconcile my bank accounts",
    "catch up on my books",
  ],
  "finance-ops": [
    "accounts payable invoices",
    "AP/AR for my books",
    "process vendor invoices",
  ],
  "do-taxes": [
    "file my 1040",
    "sort my tax deductions",
    "do my personal taxes",
  ],
  "real-estate": [
    "real estate",
    "REAL ESTATE",
    'real estate"',
    '"real estate',
    "help me real estate",
    "please real estate",
    "I need an AI to real estate",
    "I need an AI for real estate",
    "for me to real estate",
    "find and agent to real estate",
    "find an agent for real estate",
    "best AI tool for real estate",
    "best AI for real estate",
    "best tool for real estate",
    "use an agent for real estate",
    "is there an AI for real estate",
    "can you help with real estate",
    "real estate?",
    "real estate!!!",
    "I want an AI tool for real estate",
    "help with real estate",
    "looking for an AI tool for real estate",
    "best agents for real estate",
    "use an AI for real estate",
    "tool for real estate",
  ],
};

export type Paraphrase = {
  query: string;
  useCase: string;
  realEstate: boolean;
};

function coresFor(concept: Concept): string[] {
  const cores = [
    ...(EXTRA[concept.useCase] ?? []),
    ...concept.phrases.filter((phrase) => !SKIP_PHRASE.has(phrase)),
    ...concept.anchors.filter((anchor) => anchor.length >= 4).slice(0, 4),
  ];
  return [...new Set(cores)];
}

function wraps(core: string, concept: Concept): string[] {
  const out = [
    core,
    `help me ${core}`,
    `I need an AI to ${core}`,
    `please ${core}`,
    `${core}"`,
    `for me to ${core}`,
    `find and agent to ${core}`,
    `can you ${core}?`,
    `I need an AI that can ${core}`,
  ];
  if (!concept.broad && concept.id !== "workflow" && concept.useCase !== "real-estate") {
    out.push(`${core} for my business`);
  }
  return out;
}

export function buildParaphrases(): Paraphrase[] {
  const rows: Paraphrase[] = [];
  for (const concept of CONCEPTS) {
    const queries: string[] = [];
    const add = (query: string) => {
      const trimmed = query.replace(/\s+/g, " ").trim();
      if (!trimmed || queries.includes(trimmed)) return;
      queries.push(trimmed);
    };
    if (concept.useCase === "real-estate") {
      for (const query of EXTRA["real-estate"]) add(query);
    } else {
      for (const core of coresFor(concept)) {
        for (const query of wraps(core, concept)) {
          add(query);
          if (queries.length >= 28) break;
        }
        if (queries.length >= 28) break;
      }
    }
    for (const query of queries) {
      rows.push({
        query,
        useCase: concept.useCase,
        realEstate: REAL_ESTATE.has(concept.useCase),
      });
    }
  }
  return rows;
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
  got: string | null;
  intro: string;
  top: string[];
  pass: boolean;
  reason: string;
};

export type ParaphraseReport = {
  grades: ParaphraseGrade[];
  problems: string[];
  passRate: number;
  precisionAt3: number;
  byUseCase: Array<{ useCase: string; total: number; passed: number; rate: number }>;
  realEstateCount: number;
};

export function gradeParaphrases(catalog: Catalog): ParaphraseReport {
  const paraphrases = buildParaphrases();
  const grades: ParaphraseGrade[] = [];
  const problems: string[] = [];
  let passed = 0;
  let hits = 0;
  let slots = 0;
  const byUseCase = new Map<string, { total: number; passed: number }>();

  const counts = new Map<string, number>();
  for (const item of paraphrases) counts.set(item.useCase, (counts.get(item.useCase) ?? 0) + 1);
  for (const [useCase, total] of counts) {
    if (total < 25) problems.push(`${useCase}: only ${total} paraphrase variants`);
  }
  if (!paraphrases.some((item) => item.query === FOUNDER_QUERY)) {
    problems.push("founder demo query is missing from the paraphrase set");
  }

  for (const item of paraphrases) {
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
    const reasons: string[] = [];
    if (got !== item.useCase) reasons.push(`ranked ${got ?? "none"}`);
    if (generic) reasons.push("generic intro");
    if (offDomain.length > 0) reasons.push(`off-domain ${offDomain.map((tool) => tool.name).join(", ")}`);
    if (specialists.length === 0 && topTools.some((tool) => !tool.generalPurpose)) {
      reasons.push("specialist on an assistant-only job");
    }
    const pass = reasons.length === 0;
    if (pass) passed += 1;
    else if (problems.length < 40) problems.push(`${item.useCase}: ${item.query} → ${reasons.join("; ")}`);
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
      got,
      intro: ranked.intro,
      top: topTools.map((tool) => tool.name),
      pass,
      reason: reasons.join("; "),
    });
  }

  const rates = [...byUseCase.entries()]
    .map(([useCase, bucket]) => ({
      useCase,
      total: bucket.total,
      passed: bucket.passed,
      rate: bucket.total === 0 ? 0 : bucket.passed / bucket.total,
    }))
    .sort((a, b) => a.rate - b.rate || a.useCase.localeCompare(b.useCase));

  return {
    grades,
    problems,
    passRate: paraphrases.length === 0 ? 0 : passed / paraphrases.length,
    precisionAt3: slots === 0 ? 0 : hits / slots,
    byUseCase: rates,
    realEstateCount: paraphrases.filter((item) => item.realEstate).length,
  };
}

export function paraphraseProblems(catalog: Catalog): string[] {
  const report = gradeParaphrases(catalog);
  const problems = [...report.problems];
  if (report.realEstateCount < 150) {
    problems.unshift(`real estate paraphrase section has ${report.realEstateCount} queries`);
  }
  if (report.passRate < 1) {
    problems.unshift(
      `paraphrase pass rate ${report.passRate.toFixed(3)} (${report.byUseCase.filter((item) => item.passed === item.total).length}/${report.byUseCase.length} use cases clean)`,
    );
  }
  return problems;
}

export function paraphraseSummary(catalog: Catalog): string {
  const report = gradeParaphrases(catalog);
  const lines = [
    `Paraphrase gate: ${report.grades.length} variants, pass rate ${(report.passRate * 100).toFixed(1)}%, precision@3 ${report.precisionAt3.toFixed(3)}.`,
    `Real estate variants: ${report.realEstateCount}.`,
    "",
    "Per-use-case pass rate:",
  ];
  for (const row of [...report.byUseCase].sort((a, b) => a.useCase.localeCompare(b.useCase))) {
    lines.push(`- ${row.useCase}: ${(row.rate * 100).toFixed(1)}% (${row.passed}/${row.total})`);
  }
  return lines.join("\n");
}

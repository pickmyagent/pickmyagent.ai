import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import test from "node:test";
import { CONCEPTS } from "../lib/concepts.ts";
import { domainAssistantLine } from "../lib/assistant-lines.ts";
import { specialistLine, specialistLinePairs } from "../lib/specialist-lines.ts";
import { BROKEN_ASSISTANT, BROKEN_HEADERS, descriptionProblems, grammarProblems, specialistWhyProblems, toolPageBulletProblems, toolPageCopyProblems } from "../scripts/grammar-gate.ts";
import { QA_QUERIES, catalogLeakProblems, qaProblems, renderSearchQaReport } from "../scripts/search-qa.ts";
import {
  GENERIC_MATCH_WORDS,
  jobLead,
  mentionsLand,
  queryTokens,
  rankCatalogQuery,
  type RankedSearch,
} from "../lib/search.ts";
import type { Catalog } from "../lib/types.ts";

const catalog = JSON.parse(
  readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8"),
) as Catalog;

const QUERIES = [
  "Create a highlight reel from my twitch streams",
  "make a youtube short",
  "automate my email",
  "generate a movie",
];

for (const query of QUERIES) {
  test(`search returns results for: ${query}`, () => {
    const ranked = rankCatalogQuery(query, catalog);
    assert.ok(ranked.tools.length > 0, `${query} returned no tools`);
    assert.ok(ranked.useCases.length > 0, `${query} returned no use cases`);
  });
}

const LAND_QUERIES = [
  "I need an agent to help me find viable land deals",
  "find an agent to help me find potentially viable land deals",
];

const INVEST_QUERIES = [
  "help manage my investment portfolio",
  "find an agent that will help me manage investments",
];

const VIDEO_OR_GAME_CATEGORIES = new Set(["creative-media", "game-ai"]);

const VIDEO_OR_GAME_TAGS = new Set([
  "creator-video-audio",
  "game-creative",
  "game-npcs",
]);

const OTHER_OFF_DOMAIN_TAGS = new Set([
  "coding-agents",
  "multi-agent-workflows",
  "tool-use-browser",
  "workflow-automation",
  "research-rag",
  "meetings-knowledge",
]);

function assertJobResult(query: string, useCaseTag: string, ranked: RankedSearch) {
  assert.ok(ranked.intro.trim().length > 40, `${query} is missing the intro sentence`);
  assert.match(ranked.intro, /^AI agents\b/, `${query} intro: ${ranked.intro}`);
  assert.ok(ranked.tools.length > 0, `${query} returned no tools`);

  const firstGeneral = ranked.tools.findIndex((tool) => tool.generalPurpose);
  assert.ok(firstGeneral > 0, `${query} did not rank a specialist first`);

  ranked.tools.forEach((rankedTool, index) => {
    assert.ok(
      rankedTool.whyItHelps.trim().length > 0,
      `${query} / ${rankedTool.name} is missing a why-line`,
    );
    const tool = catalog.tools.find((item) => item.slug === rankedTool.slug);
    assert.ok(tool, rankedTool.slug);
    const videoOrGame =
      tool.categories.some((category) => VIDEO_OR_GAME_CATEGORIES.has(category)) ||
      tool.useCaseTags.some((tag) => VIDEO_OR_GAME_TAGS.has(tag));
    assert.equal(videoOrGame, false, `${query}: ${tool.name} is a video or game tool`);
    if (index < firstGeneral) {
      assert.equal(rankedTool.generalPurpose, false, `${rankedTool.name} is labeled general but ranks with specialists`);
      assert.ok(
        tool.useCaseTags.includes(useCaseTag),
        `${query}: ${tool.name} is off-domain (${tool.useCaseTags.join(", ") || "no tags"})`,
      );
      assert.equal(
        tool.useCaseTags.some((tag) => OTHER_OFF_DOMAIN_TAGS.has(tag)),
        false,
        `${query}: ${tool.name} carries an off-domain tag`,
      );
    } else {
      assert.equal(
        rankedTool.generalPurpose,
        true,
        `${query}: ${rankedTool.name} appears after specialists without the general-assistant label`,
      );
    }
  });
}

for (const query of LAND_QUERIES) {
  test(`land query stays on real estate: ${query}`, () => {
    assertJobResult(query, "find-land", rankCatalogQuery(query, catalog));
  });
}

for (const query of INVEST_QUERIES) {
  test(`investing query stays on portfolios: ${query}`, () => {
    assertJobResult(query, "manage-portfolio", rankCatalogQuery(query, catalog));
  });
}

test("generic words do not select a specialist", () => {
  for (const word of GENERIC_MATCH_WORDS) {
    assert.deepEqual(queryTokens(word), [], word);
    assert.equal(queryTokens(`please ${word} an item`).includes(word), false, word);
  }
  const ranked = rankCatalogQuery(
    "find an agent to help me build and make what I need",
    catalog,
  );
  assert.equal(ranked.useCases.length, 0);
  assert.ok(ranked.tools.length > 0);
  assert.ok(ranked.tools.every((tool) => tool.generalPurpose));
  assert.match(ranked.intro, /^AI assistants can help with .+ by turning it into a plan/);
  assert.equal(/\bparts of\b/i.test(ranked.intro), false);
  for (const tool of ranked.tools) {
    assert.ok(tool.whyItHelps.trim().length > 0, tool.name);
  }
});

const SAMPLE_QUERIES = [
  "I need help managing my investment portfolio",
  "agents to help me find land in South Carolina",
  "clip my YouTube videos",
  "make a sizzle reel from my gaming stream",
  "automate my personal tasks",
  "edit listing videos for real estate",
  "write my resume",
  "plan a trip",
];

for (const query of SAMPLE_QUERIES) {
  test(`intro and why-line for: ${query}`, () => {
    const ranked = rankCatalogQuery(query, catalog);
    assert.ok(ranked.tools.length > 0, query);
    assert.ok(ranked.intro.trim().length > 40, ranked.intro);
    assert.match(ranked.intro, /AI (?:agents|assistants)/);
    for (const tool of ranked.tools) {
      assert.ok(tool.whyItHelps.trim().length > 0, `${query} / ${tool.name}`);
    }
  });
}

test("every tool has one strength and one weakness", () => {
  assert.ok(catalog.tools.length >= 57, `catalog has ${catalog.tools.length} tools`);
  for (const tool of catalog.tools) {
    for (const field of ["strength", "weakness"] as const) {
      const value = tool[field];
      assert.equal(typeof value, "string", tool.id);
      assert.ok(value.endsWith("."), `${tool.id} ${field}`);
      const body = value.slice(0, -1).replace(/\d+(?:\.\d+)+/g, "");
      assert.equal(/[.!?]/.test(body), false, `${tool.id} ${field} is more than one sentence`);
    }
  }
});

test("search results label general assistants and show the intro", () => {
  const source = readFileSync(new URL("../components/job-search.tsx", import.meta.url), "utf8");
  assert.match(source, /tool\.generalPurpose[\s\S]{0,240}General-purpose AI assistant/);
  assert.match(source, /ranked\.intro/);
  assert.match(source, /tool\.whyItHelps/);
});

const LAND_WORD = /\b(land|parcels?|acres?|acreage|lots?)\b/i;

const STORED_INTROS = new Map(
  catalog.useCases
    .filter((useCase) => useCase.intro)
    .map((useCase) => [useCase.slug, useCase.intro as string]),
);

type JobExpect = {
  query: string;
  useCase: string | null;
  intro: RegExp;
  exactIntro?: string;
  disclaimer?: RegExp;
};

const REAL_ESTATE_RANK_INTRO =
  "AI agents can compare property records and rental or flip numbers so you sort the deals yourself.";

const JOBS: JobExpect[] = [
  {
    query: "Find real estate deals that might not yet have a realtor, and reach them",
    useCase: "find-off-market",
    intro: /for-sale-by-owner|off-market|owner/i,
  },
  {
    query: "find homes for sale by owner",
    useCase: "find-off-market",
    intro: /for-sale-by-owner|off-market|owner/i,
  },
  {
    query: "find motivated sellers and text them",
    useCase: "find-off-market",
    intro: /for-sale-by-owner|off-market|owner|seller/i,
  },
  {
    query: "find a realtor for my house",
    useCase: null,
    intro: /realtor/,
  },
  {
    query: "I need an agent to help me find viable land deals",
    useCase: "find-land",
    intro: /land|parcel/,
  },
  {
    query: "find an agent to help me find potentially viable land deals",
    useCase: "find-land",
    intro: /land|parcel/,
  },
  {
    query: "help manage my investment portfolio",
    useCase: "manage-portfolio",
    intro: /portfolio|investment/,
    disclaimer: /not financial advice/i,
  },
  { query: "plan a wedding", useCase: null, intro: /wedding/ },
  { query: "write a cookbook", useCase: null, intro: /cookbook/ },
  { query: "train my dog", useCase: null, intro: /dog/ },
  { query: "organize my garage", useCase: null, intro: /garage/ },
  { query: "bake a cake", useCase: null, intro: /cake/ },
  {
    query: "Find real estate deals and rank them",
    useCase: "rank-property-deals",
    intro: /property records|sort the deals/,
    exactIntro: REAL_ESTATE_RANK_INTRO,
  },
  {
    query: "rank rental properties by cash flow",
    useCase: "rank-property-deals",
    intro: /property records|rental or flip/,
  },
  {
    query: "score houses to flip",
    useCase: "rank-property-deals",
    intro: /property records|flip/,
  },
  {
    query: "find commercial real estate deals",
    useCase: "rank-property-deals",
    intro: /property records|sort the deals/,
  },
  {
    query: "I want to find an agent that will do my taxes",
    useCase: "do-taxes",
    intro: /tax/,
    disclaimer: /not tax or financial advice/i,
  },
  {
    query: "I want to find an ai tool that will find me the best deal on a vacation",
    useCase: "plan-travel",
    intro: /vacation|travel|flight|hotel/,
  },
  {
    query: "Handle customer support tickets and resolve common issues autonomously (refunds, returns, FAQs, order status, escalation only when needed)",
    useCase: "customer-support",
    intro: /support|ticket|refund/,
  },
  {
    query: "Handle customer support tickets and resolve common issues autonomously",
    useCase: "customer-support",
    intro: /support|ticket/,
  },
  {
    query: "Write, debug, refactor, and ship code (full feature development, bug fixes, pull requests, legacy code upgrades, test generation)",
    useCase: "coding-agents",
    intro: /code/,
  },
  {
    query: "Write, debug, refactor, and ship code",
    useCase: "coding-agents",
    intro: /code/,
  },
  {
    query: "Do deep multi-step research and synthesize findings (competitive analysis, market research, literature reviews, cited reports from dozens of sources)",
    useCase: "deep-research",
    intro: /research/,
  },
  {
    query: "Do deep multi-step research and synthesize findings",
    useCase: "deep-research",
    intro: /research/,
  },
  {
    query: "Qualify leads, research accounts, and handle sales outreach (prospect research, personalized email sequences, CRM updates, pipeline management)",
    useCase: "sales-outreach",
    intro: /lead|sales|outreach/,
  },
  {
    query: "Qualify leads, research accounts, and handle sales outreach",
    useCase: "sales-outreach",
    intro: /lead|sales|outreach/,
  },
  {
    query: "Manage my email inbox (triage, prioritize, draft replies, summarize threads, auto-route or archive)",
    useCase: "manage-inbox",
    intro: /inbox|email/,
  },
  {
    query: "Manage my email inbox",
    useCase: "manage-inbox",
    intro: /inbox|email/,
  },
  {
    query: "Act as a personal assistant for scheduling and admin (calendar management, meeting prep, follow-ups, reminders, task orchestration across tools)",
    useCase: "scheduling-assistant",
    intro: /calendar|schedul/,
  },
  {
    query: "Act as a personal assistant for scheduling and admin",
    useCase: "scheduling-assistant",
    intro: /calendar|schedul/,
  },
  {
    query: "Create and optimize content (blog posts, social media, SEO articles, marketing copy, campaign assets at scale)",
    useCase: "create-content",
    intro: /content|blog|seo|copy/,
  },
  {
    query: "Create and optimize content",
    useCase: "create-content",
    intro: /blog|copy|SEO|heading/,
  },
  {
    query: "Analyze data and generate reports (spreadsheets, dashboards, anomaly detection, financial or business insights from multiple sources)",
    useCase: "analyze-data",
    intro: /data|report|spreadsheet/,
  },
  {
    query: "Analyze data and generate reports",
    useCase: "analyze-data",
    intro: /data|report/,
  },
  {
    query: "Screen and source candidates for hiring (resume review, outreach, interview scheduling, candidate ranking)",
    useCase: "hire-candidates",
    intro: /candidate|hiring|resume/,
  },
  {
    query: "Screen and source candidates for hiring",
    useCase: "hire-candidates",
    intro: /candidate|hiring/,
  },
  {
    query: "Plan and book travel (itineraries, flights, hotels, activities, real-time adjustments based on preferences and constraints)",
    useCase: "plan-travel",
    intro: /travel|flight|hotel|itinerar/,
  },
  {
    query: "Plan and book travel",
    useCase: "plan-travel",
    intro: /travel|flight|hotel/,
  },
  {
    query: "Shop and recommend products (personalized recommendations, price comparison, guided purchasing, order tracking)",
    useCase: "shop-products",
    intro: /product|shop/,
  },
  {
    query: "Shop and recommend products",
    useCase: "shop-products",
    intro: /product|shop/,
  },
  {
    query: "Process invoices and handle finance ops (extract data, match to POs, flag exceptions, expense auditing)",
    useCase: "finance-ops",
    intro: /invoice|finance|expense/,
    disclaimer: /not tax or financial advice/i,
  },
  {
    query: "Process invoices and handle finance ops",
    useCase: "finance-ops",
    intro: /invoice|finance/,
    disclaimer: /not tax or financial advice/i,
  },
  {
    query: "Turn meeting notes into actions (transcribe, extract decisions/action items, assign tasks in project tools automatically)",
    useCase: "meetings-knowledge",
    intro: /meeting|action/,
  },
  {
    query: "Turn meeting notes into actions",
    useCase: "meetings-knowledge",
    intro: /meeting|action/,
  },
  {
    query: "Answer questions from internal knowledge bases (enterprise search, policy lookup, document Q&A with citations)",
    useCase: "knowledge-qa",
    intro: /knowledge|policy|document/,
  },
  {
    query: "Answer questions from internal knowledge bases",
    useCase: "knowledge-qa",
    intro: /knowledge/,
  },
  {
    query: "Run browser-based or computer-use tasks (fill forms, navigate websites, complete multi-step online workflows that require clicking and typing)",
    useCase: "tool-use-browser",
    intro: /browser/,
  },
  {
    query: "Run browser-based or computer-use tasks",
    useCase: "tool-use-browser",
    intro: /browser/,
  },
  {
    query: "Manage social media (content scheduling, engagement monitoring, trend analysis, response drafting)",
    useCase: "social-media",
    intro: /social/,
  },
  {
    query: "Manage social media",
    useCase: "social-media",
    intro: /social/,
  },
  {
    query: "Handle IT help desk requests (troubleshoot common issues, reset passwords, route tickets, basic system actions)",
    useCase: "it-helpdesk",
    intro: /help desk|password|IT/,
  },
  {
    query: "Handle IT help desk requests",
    useCase: "it-helpdesk",
    intro: /help desk|IT/,
  },
  {
    query: "Monitor and respond to threats or incidents (security triage, phishing analysis, anomaly detection with context)",
    useCase: "security-ops",
    intro: /threat|phish|security|incident/,
  },
  {
    query: "Monitor and respond to threats or incidents",
    useCase: "security-ops",
    intro: /threat|phish|security|incident/,
  },
  {
    query: "Orchestrate multi-tool workflows (connect CRM + email + calendar + docs for end-to-end processes like onboarding or quote-to-cash)",
    useCase: "workflow-automation",
    intro: /workflow/,
  },
  {
    query: "Orchestrate multi-tool workflows",
    useCase: "workflow-automation",
    intro: /workflow/,
  },
  {
    query: "Support personalized learning or tutoring (adaptive study plans, explain concepts, generate practice problems, track progress)",
    useCase: "tutoring",
    intro: /tutor|learning|study|practice/,
  },
  {
    query: "Support personalized learning or tutoring",
    useCase: "tutoring",
    intro: /tutor|learning/,
  },
];

function matchTagsFor(slug: string): string[] {
  return catalog.useCases.find((useCase) => useCase.slug === slug)?.matchTags ?? [slug];
}

function assertWhyMentionsJob(query: string, ranked: RankedSearch) {
  const tokens = queryTokens(query).filter((token) => token.length > 3);
  const matched = catalog.useCases.find((item) => item.slug === ranked.useCases[0]?.slug);
  const jobTokens = (matched?.jobPhrase ?? "").toLowerCase().match(/[a-z0-9]{4,}/g) ?? [];
  for (const tool of ranked.tools) {
    const why = tool.whyItHelps.toLowerCase();
    assert.ok(tool.whyItHelps.trim().length > 0, `${query} / ${tool.name} is missing a why-line`);
    const mentionsQuery = tokens.some((token) => why.includes(token));
    const mentionsJob = jobTokens.some((token) => why.includes(token));
    if (tool.generalPurpose && matched) {
      const written = domainAssistantLine(tool.slug, matched.slug);
      assert.ok(
        written === tool.whyItHelps || mentionsJob || mentionsQuery,
        `${query} / ${tool.name} why-line is not about this job: ${tool.whyItHelps}`,
      );
      continue;
    }
    if (matched && specialistLine(matched.slug, tool.slug) === tool.whyItHelps) continue;
    assert.ok(
      mentionsQuery || mentionsJob || tokens.length === 0,
      `${query} / ${tool.name} why-line is not about this job: ${tool.whyItHelps}`,
    );
  }
}

function assertNoBorrowedIntro(query: string, ranked: RankedSearch) {
  const matched = ranked.useCases[0]?.slug ?? null;
  for (const [slug, intro] of STORED_INTROS) {
    if (slug === matched) continue;
    assert.notEqual(ranked.intro, intro, `${query} borrowed the ${slug} intro`);
  }
}

function assertJob(job: JobExpect) {
  const ranked = rankCatalogQuery(job.query, catalog);
  const matchedCase = catalog.useCases.find((item) => item.slug === ranked.useCases[0]?.slug) ?? null;
  assert.equal(ranked.lead, jobLead(job.query, matchedCase), job.query);
  assert.match(ranked.intro, /^AI (?:agents|assistants)\b/, `${job.query} intro: ${ranked.intro}`);
  assert.match(ranked.intro, job.intro, `${job.query} intro: ${ranked.intro}`);
  if (job.exactIntro) assert.equal(ranked.intro, job.exactIntro);
  if (!mentionsLand(job.query)) {
    assert.equal(LAND_WORD.test(ranked.lead), false, `${job.query} header mentions land: ${ranked.lead}`);
    assert.equal(LAND_WORD.test(ranked.intro), false, `${job.query} intro mentions land: ${ranked.intro}`);
  }
  assertNoBorrowedIntro(job.query, ranked);
  assertWhyMentionsJob(job.query, ranked);
  assert.ok(ranked.tools.length >= 4, `${job.query} returned too few tools`);

  if (job.disclaimer) {
    assert.match(ranked.disclaimer ?? "", job.disclaimer, job.query);
  }

  if (!job.useCase) {
    assert.equal(ranked.fallback, true, job.query);
    assert.equal(ranked.useCases.length, 0, job.query);
    assert.ok(
      ranked.tools.every((tool) => tool.generalPurpose),
      `${job.query} forced a specialist: ${ranked.tools.map((tool) => tool.name).join(", ")}`,
    );
    return;
  }

  assert.equal(ranked.fallback, false, job.query);
  assert.equal(ranked.useCases[0]?.slug, job.useCase, job.query);
  const concept = CONCEPTS.find((item) => item.useCase === job.useCase);
  assert.ok(concept, job.useCase);
  const allowed = new Set(concept.categories);
  const tags = matchTagsFor(job.useCase);
  const firstGeneral = ranked.tools.findIndex((tool) => tool.generalPurpose);
  assert.ok(firstGeneral > 0, `${job.query} did not rank a specialist first`);
  ranked.tools.forEach((rankedTool, index) => {
    const tool = catalog.tools.find((item) => item.slug === rankedTool.slug);
    assert.ok(tool, rankedTool.slug);
    if (index < firstGeneral) {
      assert.equal(rankedTool.generalPurpose, false, rankedTool.name);
      assert.ok(
        tool.useCaseTags.some((tag) => tags.includes(tag)),
        `${job.query}: ${tool.name} is off-domain (${tool.useCaseTags.join(", ")})`,
      );
      assert.ok(
        tool.categories.every((category) => allowed.has(category)),
        `${job.query}: ${tool.name} category ${tool.categories.join(", ")} is outside ${job.useCase}`,
      );
    } else {
      assert.equal(rankedTool.generalPurpose, true, `${job.query}: ${rankedTool.name}`);
    }
  });
}

for (const job of JOBS) {
  test(`job search stays on the user's words: ${job.query}`, () => {
    assertJob(job);
  });
}

const HEADER_CASES: { query: string; lead: string; intro: string | RegExp }[] = [
  {
    query: "Use an agent for my investment portfolio",
    lead: "For managing your investment portfolio, here's how each tool can help:",
    intro: "AI agents can help you manage an investment portfolio by lining up accounts, comparing fees, and drafting questions about risk.",
  },
  {
    query: "agent for taxes",
    lead: "For doing your taxes, here's how each tool can help:",
    intro: /tax/,
  },
  {
    query: "AI for my small business",
    lead: "For help with your small business, here's how each tool can help:",
    intro: /^AI agents can capture receipts, send invoices/,
  },
  {
    query: "best AI tool for real estate",
    lead: "For finding AI tools for real estate, here's how each tool can help:",
    intro: "AI agents can compare a property deal, plan a listing video, and draft owner outreach, and you still decide which home to pursue.",
  },
  {
    query: "is there an AI that can plan my trip",
    lead: "For planning your trip, here's how each tool can help:",
    intro: /^AI agents\b/,
  },
  {
    query: "Help me with my resume",
    lead: "For writing your resume, here's how each tool can help:",
    intro: /draft resume bullets/,
  },
  {
    query: "AI video with camera moves",
    lead: "For making an AI video with camera moves, here's how each tool can help:",
    intro: /cinematic shot/,
  },
  {
    query: "text to speech",
    lead: "For making speech from text, here's how each tool can help:",
    intro: /voice/,
  },
  {
    query: "text to image",
    lead: "For making an image from text, here's how each tool can help:",
    intro: /describe the image you want/,
  },
  {
    query: "make a 3d model",
    lead: "For making a 3D model, here's how each tool can help:",
    intro: /3D asset/,
  },
  {
    query: "deepseek alternative",
    lead: "For finding a DeepSeek alternative, here's how each tool can help:",
    intro: /coding models/,
  },
  {
    query: "resume review",
    lead: "For reviewing a resume, here's how each tool can help:",
    intro: /resume bullets/,
  },
  {
    query: "investment portfolio",
    lead: "For managing an investment portfolio, here's how each tool can help:",
    intro: "AI agents can help you manage an investment portfolio by lining up accounts, comparing fees, and drafting questions about risk.",
  },
  {
    query: "USE AI TO WRITE EMAILS",
    lead: "For writing emails, here's how each tool can help:",
    intro: /^AI assistants can help with writing emails by drafting a first version/,
  },
];

test("wrapped queries become a gerund job in the header and intro", () => {
  const banned = /\b(use an agent|i want|find an agent|is there an ai|best ai|help me)\b/i;
  for (const item of HEADER_CASES) {
    const ranked = rankCatalogQuery(item.query, catalog);
    assert.equal(ranked.lead, item.lead, item.query);
    if (item.intro instanceof RegExp) assert.match(ranked.intro, item.intro, `${item.query}: ${ranked.intro}`);
    else assert.equal(ranked.intro, item.intro, item.query);
    assert.equal(/\bparts of\b/i.test(ranked.intro), false, ranked.intro);
    assert.equal(banned.test(ranked.lead), false, ranked.lead);
    assert.equal(banned.test(ranked.intro), false, ranked.intro);
    assert.match(ranked.lead, /^For [a-z]/, ranked.lead);
  }
});

test("real estate ranking header echoes the query and never the land header", () => {
  const query = "Find real estate deals and rank them";
  const ranked = rankCatalogQuery(query, catalog);
  assert.equal(
    ranked.lead,
    "For finding real estate deals and ranking them, here's how each tool can help:",
  );
  assert.equal(ranked.intro, REAL_ESTATE_RANK_INTRO);
  assert.equal(ranked.lead.includes("potentially viable land"), false);
  assert.equal(mentionsLand(query), false);
  const landOnly = ["acres", "land-id", "regrid"];
  const specialists = ranked.tools.filter((tool) => !tool.generalPurpose);
  assert.ok(specialists.length >= 2, specialists.map((tool) => tool.slug).join(", "));
  assert.ok(specialists.some((tool) => tool.slug === "propstream"));
  assert.ok(specialists.some((tool) => tool.slug === "mashvisor"));
  assert.equal(
    specialists.some((tool) => landOnly.includes(tool.slug)),
    false,
    specialists.map((tool) => tool.slug).join(", "),
  );
});

const DEAL_QUERIES = [
  "Find real estate deals and rank them",
  "rank rental properties by cash flow",
  "score houses to flip",
  "find commercial real estate deals",
];

test("deal queries rank real-estate specialists ahead of general assistants", () => {
  for (const query of DEAL_QUERIES) {
    const ranked = rankCatalogQuery(query, catalog);
    const firstGeneral = ranked.tools.findIndex((tool) => tool.generalPurpose);
    assert.ok(firstGeneral >= 2, `${query}: ${ranked.tools.map((tool) => tool.name).join(", ")}`);
    for (const rankedTool of ranked.tools.slice(0, firstGeneral)) {
      const tool = catalog.tools.find((item) => item.slug === rankedTool.slug);
      assert.ok(tool, rankedTool.slug);
      assert.ok(tool.categories.includes("real-estate"), tool.name);
      assert.equal(
        tool.useCaseTags.every((tag) => tag === "find-land"),
        false,
        `${query}: ${tool.name} is land-only`,
      );
    }
  }
});

const BANNED_WHY = [
  /that documented fit is for/i,
  /its listing says:/i,
  /when no specialist tool matches/i,
  /docs checked;\s*we did not sign up/i,
  /\$\d/,
  /\bper month\b/i,
  /\bper seat\b/i,
  /\bwhile you\b/i,
  /\bso you can find an agent\b/i,
];

function distinctiveWhy(why: string): Set<string> {
  const head = why.split(/\bwhile you\b|\bso you can\b/i)[0] ?? why;
  const tokens = head.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
  return new Set(tokens.filter((token) => token.length > 3));
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const union = new Set([...left, ...right]);
  if (union.size === 0) return 1;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / union.size;
}

test("why-lines stay specific and do not leak internal notes", () => {
  const queries = [
    ...JOBS.map((job) => job.query),
    ...QUERIES,
    ...SAMPLE_QUERIES,
    "find an agent to help me build and make what I need",
  ];
  for (const query of queries) {
    const ranked = rankCatalogQuery(query, catalog);
    const lines = ranked.tools.map((tool) => tool.whyItHelps);
    for (const line of lines) {
      for (const banned of BANNED_WHY) {
        assert.equal(banned.test(line), false, `${query}: ${line}`);
      }
    }
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const score = jaccard(distinctiveWhy(lines[i]), distinctiveWhy(lines[j]));
        assert.ok(score < 0.72, `${query} why-lines are too similar (${score.toFixed(2)}): ${lines[i]} || ${lines[j]}`);
      }
    }
  }
});

test("search newsletter prompt is wired into search and the tools page", () => {
  const search = readFileSync(new URL("../components/job-search.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../components/tool-browser.tsx", import.meta.url), "utf8");
  const prompt = readFileSync(new URL("../components/search-newsletter-prompt.tsx", import.meta.url), "utf8");
  assert.match(prompt, /Get one new AI tool every Monday/);
  assert.match(prompt, /pickmyagent-search-newsletter-dismissed/);
  assert.match(prompt, /border-l-4 border-l-gold/);
  assert.match(search, /showSearchNewsletter = Boolean\(trimmed\)/);
  assert.match(search, /search-results-inline/);
  assert.match(search, /search-results-end/);
  assert.match(browser, /tools-search-inline/);
  assert.match(browser, /tools-search-end/);
  assert.match(browser, /searched && !dismissed/);
});

test("newsletter prompt renders at most once on a results page", () => {
  const search = readFileSync(new URL("../components/job-search.tsx", import.meta.url), "utf8");
  const browser = readFileSync(new URL("../components/tool-browser.tsx", import.meta.url), "utf8");
  assert.match(search, /showSearchNewsletter && !showInlineNewsletter/);
  assert.match(browser, /showSearchNewsletter && !showInlineNewsletter/);
  assert.equal((search.match(/<SearchNewsletterPrompt/g) ?? []).length, 2);
  assert.equal((browser.match(/<SearchNewsletterPrompt/g) ?? []).length, 2);
});

test("grammar gate flags the broken header and assistant examples", () => {
  for (const phrase of BROKEN_HEADERS) {
    const problems = grammarProblems(`For ${phrase}, here's how each tool can help:`, "header");
    assert.ok(problems.length > 0, phrase);
  }
  for (const phrase of BROKEN_ASSISTANT) {
    assert.ok(grammarProblems(phrase, "why").length > 0, phrase);
  }
  const ranked = rankCatalogQuery("fix my car", catalog);
  assert.equal(ranked.lead, "For fixing your car, here's how each tool can help:");
  const sellers = rankCatalogQuery("use an agent for motivated sellers", catalog);
  assert.equal(sellers.lead, "For finding motivated sellers, here's how each tool can help:");
  const fsbo = rankCatalogQuery("fsbo near me", catalog);
  assert.equal(fsbo.lead, "For help with FSBO near me, here's how each tool can help:");
  const gmail = rankCatalogQuery("triage my gmail", catalog);
  assert.equal(gmail.lead, "For triaging your Gmail, here's how each tool can help:");
  const rag = rankCatalogQuery("rag", catalog);
  assert.equal(rag.lead, "For building a RAG pipeline, here's how each tool can help:");
  const tutor = rankCatalogQuery("I need AI to tutor me", catalog);
  assert.equal(tutor.lead, "For getting tutoring help, here's how each tool can help:");
  assert.ok(descriptionProblems("No monthly price confirmed.").length > 0);
  assert.ok(descriptionProblems("Pricing page included a free-to-start option.").length > 0);
  assert.ok(descriptionProblems("The plans on the page we read are paid.").length > 0);
  assert.deepEqual(descriptionProblems("Free to start; paid plans on their site."), []);
  assert.ok(toolPageCopyProblems("We imported the package locally.").length > 0);
  assert.ok(toolPageCopyProblems("The page we read lists a price.").length > 0);
  assert.ok(toolPageCopyProblems("Our checker fetched the homepage.").length > 0);
  assert.ok(toolPageCopyProblems("We fetched the pricing page.").length > 0);
  assert.ok(toolPageCopyProblems("The pricing crawl left the price unconfirmed.").length > 0);
  assert.deepEqual(toolPageCopyProblems("The plan comparison lists Basic at $10 per month."), []);
  assert.deepEqual(toolPageCopyProblems("We may earn a commission if you use it."), []);
  assert.deepEqual(toolPageCopyProblems("Docs checked means the official site was opened."), []);
  assert.ok(toolPageCopyProblems("Homepage response: Status 200 → https://abnormal.ai/").length > 0);
  assert.ok(toolPageCopyProblems("The checker returned HTTP 403.").length > 0);
  assert.ok(toolPageCopyProblems("A local install was not run, so this is not a smoke test.").length > 0);
  assert.deepEqual(
    toolPageCopyProblems(
      "Docs checked means we reviewed the official site, pricing, and docs. We have not tested this tool hands-on.",
    ),
    [],
  );
  assert.ok(toolPageCopyProblems("pip install + import browser_use").length > 0);
  assert.ok(toolPageCopyProblems("browser-use==0.13.11").length > 0);
  assert.ok(toolPageCopyProblems("Free to start; paid plans on their site.").length > 0);
  assert.ok(toolPageCopyProblems("No API key, no LLM invoke, no signup.").length > 0);
  assert.ok(toolPageCopyProblems("Installed without a model call.").length > 0);
  assert.ok(toolPageCopyProblems("The browser-use package imports Agent.").length > 0);
  assert.ok(toolPageCopyProblems("Official page reviewed on 2026-10-19.").length > 0);
  assert.deepEqual(toolPageCopyProblems("An important packaged result."), []);
  assert.deepEqual(
    toolPageCopyProblems(
      "We installed version 0.13.11 and confirmed it loads. We did not sign up, pay, or run it on a real task.",
    ),
    [],
  );
  assert.deepEqual(toolPageCopyProblems("Smoke-tested means we tried this tool ourselves."), []);
  assert.ok(toolPageCopyProblems("Paid samples on the page included about $16.").length > 0);
  assert.ok(toolPageCopyProblems("A monthly starting price is not listed here.").length > 0);
  assert.ok(toolPageCopyProblems("The pricing page came back too thin.").length > 0);
  assert.ok(toolPageCopyProblems("The pricing path redirected to the homepage.").length > 0);
  assert.ok(toolPageCopyProblems("Re-read the pricing page.").length > 0);
  assert.ok(toolPageCopyProblems("The price was shown as animated digits.").length > 0);
  assert.ok(toolPageCopyProblems("A sample JSON price was ignored.").length > 0);
  assert.ok(toolPageCopyProblems("Prices did not load without JavaScript.").length > 0);
  assert.ok(toolPageCopyProblems("Paid plans — see the site.").length > 0);
  assert.deepEqual(toolPageCopyProblems("Free plan available. Paid plans start at $19 per month."), []);
  assert.deepEqual(toolPageCopyProblems("See their site for current pricing."), []);
  assert.ok(toolPageBulletProblems("A general web-search API, which is a different job").length > 0);
  assert.ok(toolPageBulletProblems("A chat priced on the site").length > 0);
  assert.ok(toolPageBulletProblems("A dedicated pricing page").length > 0);
  assert.ok(toolPageBulletProblems("Search results, not a full browser").length > 0);
  assert.ok(toolPageBulletProblems("A one-time price instead of per seat").length > 0);
  assert.deepEqual(toolPageBulletProblems("A general web-search API (see Tavily)"), []);
  assert.deepEqual(toolPageBulletProblems("A general web-search API"), []);
});

test("every specialist use-case pair has a hand-written why-line", () => {
  const names = new Map(catalog.tools.map((tool) => [tool.slug, tool.name]));
  const covered = new Set(specialistLinePairs().map((pair) => `${pair.useCaseSlug}:${pair.toolSlug}`));
  for (const pair of specialistLinePairs()) {
    const name = names.get(pair.toolSlug);
    assert.ok(name, pair.toolSlug);
    assert.ok(pair.line.startsWith(`${name} `), pair.line);
    assert.deepEqual(specialistWhyProblems(name, pair.line), [], `${pair.toolSlug}: ${pair.line}`);
  }
  for (const concept of CONCEPTS) {
    const useCase = catalog.useCases.find((item) => item.slug === concept.useCase);
    assert.ok(useCase, concept.useCase);
    const allowed = new Set(concept.categories);
    const tags = useCase.matchTags ?? [concept.useCase];
    for (const tool of catalog.tools) {
      if (tool.generalPurpose || tool.status !== "published") continue;
      if (!tool.useCaseTags.some((tag) => tags.includes(tag))) continue;
      if (!tool.categories.every((category) => allowed.has(category))) continue;
      assert.ok(covered.has(`${concept.useCase}:${tool.slug}`), `${tool.name} missing a line for ${concept.useCase}`);
      assert.ok(specialistLine(concept.useCase, tool.slug), tool.slug);
    }
  }
});

test("catalog prose and the search QA harness stay grammatical", () => {
  const problems = [...catalogLeakProblems(catalog), ...qaProblems(catalog)];
  assert.deepEqual(problems, [], problems.slice(0, 12).join("\n"));
  const report = readFileSync(new URL("../qa/search-qa-report.md", import.meta.url), "utf8");
  assert.equal(report, renderSearchQaReport(catalog));
  assert.ok(QA_QUERIES.length >= 200);
  assert.match(report, new RegExp(`${QA_QUERIES.length} queries`));
});

test("tax and wedding why-lines name the job instead of the search wrapper", () => {
  const taxes = rankCatalogQuery("I want to find an agent that will do my taxes", catalog);
  const specialists = taxes.tools.filter((tool) => !tool.generalPurpose);
  assert.ok(specialists.length >= 2);
  assert.equal(new Set(specialists.map((tool) => tool.whyItHelps)).size, specialists.length);
  for (const tool of taxes.tools) {
    assert.equal(/find an agent/i.test(tool.whyItHelps), false, tool.whyItHelps);
    assert.equal(/\bwhile you\b/i.test(tool.whyItHelps), false, tool.whyItHelps);
    if (!tool.generalPurpose) {
      assert.match(tool.whyItHelps, /tax/i);
      assert.equal(/\bso you can\b/i.test(tool.whyItHelps), false, tool.whyItHelps);
      assert.deepEqual(specialistWhyProblems(tool.name, tool.whyItHelps), []);
    }
  }
  const wedding = rankCatalogQuery("plan a wedding", catalog);
  const claude = wedding.tools.find((tool) => tool.slug === "claude");
  const chatgpt = wedding.tools.find((tool) => tool.slug === "chatgpt");
  const gemini = wedding.tools.find((tool) => tool.slug === "gemini");
  const perplexity = wedding.tools.find((tool) => tool.slug === "perplexity");
  assert.ok(claude);
  assert.ok(chatgpt);
  assert.ok(gemini);
  assert.ok(perplexity);
  assert.match(claude.whyItHelps, /break planning a wedding into a step-by-step plan/i);
  assert.match(chatgpt.whyItHelps, /checklist for planning a wedding/i);
  assert.match(gemini.whyItHelps, /shared doc or sheet to track planning a wedding/i);
  assert.match(perplexity.whyItHelps, /sourced tips on planning a wedding/i);
  assert.equal(new Set(wedding.tools.map((tool) => tool.whyItHelps)).size, wedding.tools.length);
});

const HELD_OUT: { query: string; expect: string | null }[] = [
  { query: "file my 1040", expect: "do-taxes" },
  { query: "quarterly taxes for freelancers", expect: "do-taxes" },
  { query: "is there an AI that can draft a cold email", expect: "sales-outreach" },
  { query: "fsbo near me", expect: "find-off-market" },
  { query: "motivated seller list", expect: "find-off-market" },
  { query: "skip trace an owner", expect: "find-off-market" },
  { query: "vacant lot in texas", expect: "find-land" },
  { query: "zoning for this parcel", expect: "find-land" },
  { query: "manage my 401k", expect: "manage-portfolio" },
  { query: "stock portfolio rebalance", expect: "manage-portfolio" },
  { query: "triage my gmail", expect: "manage-inbox" },
  { query: "draft replies to email threads", expect: "manage-inbox" },
  { query: "reset a password for an employee", expect: "it-helpdesk" },
  { query: "help desk ticket", expect: "it-helpdesk" },
  { query: "phishing report", expect: "security-ops" },
  { query: "soc alert", expect: "security-ops" },
  { query: "literature review of batteries", expect: "deep-research" },
  { query: "competitive analysis of crm tools", expect: "deep-research" },
  { query: "screen candidates for a role", expect: "hire-candidates" },
  { query: "resume review for this applicant", expect: "hire-candidates" },
  { query: "book a hotel in lisbon", expect: "plan-travel" },
  { query: "build me an itinerary", expect: "plan-travel" },
  { query: "price comparison for headphones", expect: "shop-products" },
  { query: "shop for running shoes", expect: "shop-products" },
  { query: "match this invoice to a purchase order", expect: "finance-ops" },
  { query: "expense auditing", expect: "finance-ops" },
  { query: "turn this transcript into action items", expect: "meetings-knowledge" },
  { query: "meeting notes to tasks", expect: "meetings-knowledge" },
  { query: "search our knowledge base", expect: "knowledge-qa" },
  { query: "policy lookup for pto", expect: "knowledge-qa" },
  { query: "fill forms in the browser", expect: "tool-use-browser" },
  { query: "computer-use agent", expect: "tool-use-browser" },
  { query: "schedule instagram posts", expect: "social-media" },
  { query: "social media calendar", expect: "social-media" },
  { query: "practice problems for calculus", expect: "tutoring" },
  { query: "study plan for the bar exam", expect: "tutoring" },
  { query: "debug a failing test in the repo", expect: "coding-agents" },
  { query: "refactor this github pull request", expect: "coding-agents" },
  { query: "connect these workflows across apps", expect: "workflow-automation" },
  { query: "highlight reel from a kick stream", expect: "game-creative" },
  { query: "customer support refund for order 123", expect: "customer-support" },
  { query: "qualify leads in the crm", expect: "sales-outreach" },
  { query: "calendar management for a founder", expect: "scheduling-assistant" },
  { query: "analyze this spreadsheet", expect: "analyze-data" },
  { query: "write an seo article", expect: "create-content" },
  { query: "find real estate deals and score them", expect: "rank-property-deals" },
  { query: "rank houses by cash flow", expect: "rank-property-deals" },
  { query: "a lot of deals", expect: null },
  { query: "wheres a good wedding venue", expect: null },
  { query: "help with Ai quickbooks", expect: "bookkeeping" },
  { query: "find and agent to help automate my quickbooks clean up for my small business", expect: "bookkeeping" },
  { query: "clean up my books", expect: "bookkeeping" },
  { query: "categorize transactions", expect: "bookkeeping" },
  { query: "reconcile my bank accounts", expect: "bookkeeping" },
  { query: "bookkeeping for my small business", expect: "bookkeeping" },
  { query: "catch up on my books", expect: "bookkeeping" },
  { query: "fix messy books", expect: "bookkeeping" },
  { query: "xero cleanup", expect: "bookkeeping" },
  { query: "freshbooks", expect: "bookkeeping" },
  { query: "wave accounting", expect: "bookkeeping" },
  { query: "my accountant", expect: "bookkeeping" },
  { query: "expense reports", expect: "finance-ops" },
  { query: "run payroll", expect: null },
  { query: "paychecks", expect: null },
  { query: "payroll taxes for my staff", expect: null },
  { query: "schedule shifts for my restaurant", expect: null },
  { query: "rota for the cafe", expect: null },
  { query: "sales tax for my bakery", expect: null },
  { query: "vat return", expect: null },
  { query: "quarterly taxes", expect: "do-taxes" },
  { query: "1099s for contractors", expect: "do-taxes" },
  { query: "year-end tax prep", expect: "do-taxes" },
  { query: "cash flow for my business", expect: "analyze-data" },
  { query: "profit and loss report", expect: "analyze-data" },
  { query: "financial dashboard", expect: "analyze-data" },
  { query: "budget forecast", expect: "analyze-data" },
  { query: "customer follow-up", expect: "sales-outreach" },
  { query: "crm for leads", expect: "sales-outreach" },
  { query: "appointment booking", expect: "scheduling-assistant" },
  { query: "project management", expect: "scheduling-assistant" },
  { query: "ask for google reviews", expect: null },
  { query: "online reputation", expect: null },
  { query: "email newsletter for my bakery", expect: "marketing-promotions" },
  { query: "facebook ads for my salon", expect: "social-media" },
  { query: "social posts for my bakery", expect: "social-media" },
  { query: "local seo", expect: "create-content" },
  { query: "google business profile for my restaurant", expect: "create-content" },
  { query: "answer the phone for my salon", expect: "customer-support" },
  { query: "faq chatbot for my website", expect: "customer-support" },
  { query: "support inbox", expect: "customer-support" },
  { query: "shopify inventory and shipping", expect: "workflow-automation" },
  { query: "etsy shop orders", expect: "workflow-automation" },
  { query: "shipping labels", expect: "workflow-automation" },
  { query: "inventory for my shop", expect: "workflow-automation" },
  { query: "SOP for my plumbing company", expect: "knowledge-qa" },
  { query: "draft a quote for a kitchen remodel", expect: null },
  { query: "write a proposal", expect: null },
  { query: "draft a contract for a client", expect: null },
  { query: "meeting notes", expect: "meetings-knowledge" },
  { query: "hire staff for my restaurant", expect: "hire-candidates" },
  { query: "onboarding staff for my restaurant", expect: "hire-candidates" },
  { query: "what should a small business automate", expect: "run-a-business" },
  { query: "run my whole business with AI", expect: "run-a-business" },
  { query: "AI for my small business", expect: "run-a-business" },
];

test("compound marketing and invoice query names both jobs", () => {
  const query = "I want to find a tool to help me automate marketing promotions, and sending invoices to customers";
  const ranked = rankCatalogQuery(query, catalog);
  assert.equal(
    ranked.lead,
    "For automating marketing promotions and sending customer invoices, here's how each tool can help:",
  );
  assert.equal(
    ranked.intro,
    "AI agents can schedule promo emails and posts, and draft and send invoices on a schedule, often from one workflow that connects your marketing and billing apps.",
  );
  assert.equal(/,\s+and\b/i.test(ranked.lead), false);
  const slugs = ranked.useCases.map((useCase) => useCase.slug);
  assert.ok(slugs.includes("marketing-promotions"));
  assert.ok(slugs.includes("finance-ops"));
  const specialists = ranked.tools.filter((tool) => !tool.generalPurpose);
  const tagsOf = (slug: string) => catalog.tools.find((tool) => tool.slug === slug)?.useCaseTags ?? [];
  assert.ok(specialists.some((tool) => tagsOf(tool.slug).includes("marketing-promotions")));
  assert.ok(specialists.some((tool) => tagsOf(tool.slug).includes("finance-ops")));
  assert.ok(specialists.some((tool) => tool.slug === "n8n"));
  assert.ok(specialists.some((tool) => tool.slug === "make"));
  assert.ok(specialists.some((tool) => tool.slug === "zapier"));
  const billed = rankCatalogQuery("bill clients and draft a blog post", catalog);
  assert.equal(
    billed.lead,
    "For billing clients and drafting a blog post, here's how each tool can help:",
  );
  const notes = rankCatalogQuery("schedule meetings, also take notes", catalog);
  assert.equal(
    notes.lead,
    "For scheduling meetings and taking notes, here's how each tool can help:",
  );
  assert.equal(/,\s+and\b|help with also/i.test(notes.lead), false);
  const claude = ranked.tools.find((tool) => tool.slug === "claude");
  assert.ok(claude);
  assert.match(claude.whyItHelps, /step-by-step plan to automate marketing promotions and send customer invoices/i);
  assert.equal(/automating marketing promotions, and sending/i.test(claude.whyItHelps), false);
  assert.equal(ranked.tools.some((tool) => tool.slug === "dext"), false);
  const expenses = rankCatalogQuery("track expenses and file my taxes", catalog);
  const expenseClaude = expenses.tools.find((tool) => tool.slug === "claude");
  assert.match(expenseClaude?.whyItHelps ?? "", /step-by-step plan to track expenses and file your taxes/);
  assert.match(expenses.intro, /sort receipts into expense categories/);
  assert.equal(expenses.tools.some((tool) => tool.slug === "vic-ai"), false);
  const billedTools = billed.tools.map((tool) => tool.slug);
  assert.equal(billedTools.includes("ramp"), false);
  assert.equal(billedTools.includes("vic-ai"), false);
  const meetings = rankCatalogQuery("schedule meetings and take notes", catalog);
  assert.equal(meetings.tools.some((tool) => tool.slug === "obsidian"), false);
  const hotel = rankCatalogQuery("book a hotel and clip my twitch stream", catalog);
  assert.match(hotel.intro, /compare hotels and plan your stay, and cut your Twitch stream into vertical clips/);
  assert.equal(/\bbook your hotel\b/i.test(hotel.intro), false);
  assert.equal(hotel.tools[0]?.slug, "streamladder");
  const forms = rankCatalogQuery("fill out forms and qualify leads", catalog);
  const sales = forms.tools.filter((tool) => ["apollo", "clay", "instantly"].includes(tool.slug)).map((tool) => tool.slug);
  assert.ok(sales.indexOf("apollo") < sales.indexOf("instantly"));
  assert.ok(sales.indexOf("clay") < sales.indexOf("instantly"));
  const transcribed = rankCatalogQuery("transcribe my meeting and draft the follow-up email", catalog);
  assert.match(transcribed.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "", /transcribe your meeting/);
  assert.match(transcribed.tools.find((tool) => tool.slug === "gemini")?.whyItHelps ?? "", /transcribing your meeting/);
  const luggage = rankCatalogQuery("plan a trip and shop for luggage", catalog);
  assert.equal(luggage.tools.some((tool) => tool.slug === "daydream"), false);
  const listing = rankCatalogQuery("make a listing video and find off-market deals", catalog);
  assert.match(listing.intro, /turn listing photos into a property video/);
  assert.equal(/\bedit\b/i.test(listing.intro), false);
  assert.equal(listing.tools[0]?.slug, "autoreel");
});

test("small-business bookkeeping queries stay on the books", () => {
  const banned = /midjourney|runway|higgsfield|kling|pika|luma|elevenlabs|scenario|rosebud|buildbox/i;
  for (const query of [
    "help with Ai quickbooks",
    "find and agent to help automate my quickbooks clean up for my small business",
  ]) {
    const ranked = rankCatalogQuery(query, catalog);
    assert.equal(ranked.useCases[0]?.slug, "bookkeeping", query);
    assert.equal(ranked.fallback, false, query);
    assert.match(ranked.intro, /^AI agents\b/, ranked.intro);
    assert.match(ranked.intro, /QuickBooks/, ranked.intro);
    const specialists = ranked.tools.filter((tool) => !tool.generalPurpose);
    assert.deepEqual(specialists.slice(0, 3).map((tool) => tool.slug), ["dext", "ramp", "bill-com"], query);
    for (const tool of specialists) {
      assert.equal(banned.test(tool.name), false, `${query} showed ${tool.name}`);
      assert.match(tool.whyItHelps, /QuickBooks/, tool.whyItHelps);
    }
    assert.equal(ranked.tools.filter((tool) => tool.generalPurpose).length, 5, query);
  }
  const cleanup = rankCatalogQuery(
    "find and agent to help automate my quickbooks clean up for my small business",
    catalog,
  );
  assert.equal(cleanup.lead, "For cleaning up your QuickBooks, here's how each tool can help:");
  const plain = rankCatalogQuery("help with Ai quickbooks", catalog);
  assert.equal(plain.lead, "For help with QuickBooks, here's how each tool can help:");
  const salon = rankCatalogQuery("payroll and scheduling for my salon", catalog);
  assert.deepEqual(salon.useCases.map((item) => item.slug), ["payroll", "scheduling-assistant"]);
  assert.match(salon.intro, /^AI agents\b/);
  const both = rankCatalogQuery("clean up quickbooks and send invoices", catalog);
  assert.deepEqual(both.useCases.map((item) => item.slug), ["bookkeeping", "finance-ops"]);
});

test("held-out paraphrases report precision at 3 without failing the build", () => {
  assert.ok(HELD_OUT.length >= 40);
  let hits = 0;
  let slots = 0;
  const misses: string[] = [];
  for (const item of HELD_OUT) {
    const ranked = rankCatalogQuery(item.query, catalog);
    const top = ranked.tools.slice(0, 3);
    let queryHits = 0;
    for (const tool of top) {
      slots += 1;
      const relevant = item.expect
        ? !tool.generalPurpose &&
          (catalog.tools.find((entry) => entry.slug === tool.slug)?.useCaseTags ?? []).some((tag) =>
            matchTagsFor(item.expect as string).includes(tag),
          )
        : tool.generalPurpose;
      if (relevant) {
        hits += 1;
        queryHits += 1;
      }
    }
    if (queryHits < top.length) {
      misses.push(
        `${item.query} → expected ${item.expect ?? "fallback"}, got ${ranked.useCases[0]?.slug ?? "fallback"} [${top.map((tool) => tool.name).join(", ")}]`,
      );
    }
  }
  const precision = hits / slots;
  console.log(`held-out precision@3: ${precision.toFixed(3)} (${hits}/${slots})`);
  for (const miss of misses) console.log(`held-out miss: ${miss}`);
  assert.ok(precision >= 0);
});

test("regression report for the pull request", () => {
  const report = JOBS.map((job) => {
    const ranked = rankCatalogQuery(job.query, catalog);
    return {
      query: job.query,
      useCase: ranked.useCases[0]?.slug ?? null,
      lead: ranked.lead,
      intro: ranked.intro,
      disclaimer: ranked.disclaimer,
      tools: ranked.tools.map((tool) => ({
        name: tool.name,
        generalPurpose: tool.generalPurpose,
        why: tool.whyItHelps,
      })),
    };
  });
  writeFileSync("/tmp/search-regression-report.json", JSON.stringify(report, null, 2));
  assert.equal(report.length, JOBS.length);
});

test("specialists stay inside the query domain", () => {
  const land = rankCatalogQuery("find land", catalog);
  assert.equal(land.tools.some((tool) => tool.slug === "mashvisor"), false);
  const cine = rankCatalogQuery("make a cinematic video", catalog);
  const cineSlugs = cine.tools.map((tool) => tool.slug);
  for (const banned of ["opus", "elevenlabs", "captions", "meshy", "midjourney", "scenario", "heygen"]) {
    assert.equal(cineSlugs.includes(banned), false, banned);
  }
  assert.ok(cineSlugs.includes("higgsfield"));
  assert.ok(cineSlugs.includes("seedance"));
  assert.ok(cineSlugs.indexOf("seedance") < 5);
  const claude = cine.tools.find((tool) => tool.slug === "claude");
  assert.ok(claude);
  assert.match(claude.whyItHelps, /shot list|camera move|prompt/i);
  assert.equal(/short-clip moments/i.test(claude.whyItHelps), false);
  for (const tool of cine.tools) {
    if (!tool.generalPurpose) assert.equal(specialistWhyProblems(tool.name, tool.whyItHelps).length, 0);
  }
  const clips = rankCatalogQuery("highlight reel from a kick stream", catalog);
  const clipSlugs = clips.tools.map((tool) => tool.slug);
  for (const banned of ["meshy", "midjourney", "scenario", "elevenlabs", "higgsfield"]) {
    assert.equal(clipSlugs.includes(banned), false, banned);
  }
  assert.equal(rankCatalogQuery("screen a resume", catalog).useCases[0]?.slug, "hire-candidates");
  assert.equal(rankCatalogQuery("write my resume", catalog).useCases[0]?.slug, "write-resume");
  assert.equal(rankCatalogQuery("text to video", catalog).tools.some((tool) => tool.slug === "seedance"), true);
  assert.equal(rankCatalogQuery("image to video", catalog).tools.some((tool) => tool.slug === "opus"), false);
  const deep = rankCatalogQuery("deepseek alternative", catalog);
  assert.equal(deep.useCases[0]?.slug, "coding-agents");
  assert.match(deep.intro, /coding models/);
  assert.equal(deep.lead, "For finding a DeepSeek alternative, here's how each tool can help:");
  assert.equal(deep.tools.some((tool) => tool.slug === "deepseek"), false);
  assert.ok(deep.tools.some((tool) => !tool.generalPurpose));
  const chatgptAlt = rankCatalogQuery("chatgpt alternative", catalog);
  assert.equal(chatgptAlt.useCases[0]?.slug, undefined);
  assert.equal(chatgptAlt.lead, "For finding a ChatGPT alternative, here's how each tool can help:");
  assert.equal(chatgptAlt.tools.some((tool) => tool.slug === "chatgpt"), false);
  assert.ok(chatgptAlt.tools.length >= 4);
  assert.equal(chatgptAlt.tools.some((tool) => /step-by-step plan/i.test(tool.whyItHelps)), false);
  assert.match(chatgptAlt.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "", /compare tools/i);
  const model = rankCatalogQuery("make a 3d model", catalog);
  assert.equal(model.useCases[0]?.slug, "make-3d");
  assert.match(model.lead, /3D model/);
  const modelSlugs = model.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
  assert.deepEqual(modelSlugs, ["meshy"]);
  const picture = rankCatalogQuery("concept art", catalog);
  const pictureSlugs = picture.tools.map((tool) => tool.slug);
  assert.equal(picture.useCases[0]?.slug, "make-images");
  assert.equal(pictureSlugs.includes("meshy"), false);
  assert.ok(pictureSlugs.includes("midjourney"));
  for (const generic of ["tutor me", "homework help", "practice problems"]) {
    const ranked = rankCatalogQuery(generic, catalog);
    assert.equal(ranked.useCases[0]?.slug, "tutoring", generic);
    assert.equal(ranked.tools.some((tool) => tool.slug === "synthesis-tutor"), false, generic);
    assert.equal(ranked.tools.some((tool) => tool.slug === "duolingo-max"), false, generic);
    const specialists = ranked.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
    assert.deepEqual(specialists.slice(0, 3).sort(), ["khanmigo", "quizlet", "studyfetch"].sort(), generic);
    const firstAssistant = ranked.tools.findIndex((tool) => tool.generalPurpose);
    assert.ok(firstAssistant >= 3, generic);
  }
  for (const kids of ["k-5 math tutor", "math for kids", "3rd grade math"]) {
    const ranked = rankCatalogQuery(kids, catalog);
    assert.equal(ranked.useCases[0]?.slug, "tutoring", kids);
    assert.ok(ranked.tools.some((tool) => tool.slug === "synthesis-tutor"), kids);
    assert.equal(ranked.tools.some((tool) => tool.slug === "duolingo-max"), false, kids);
  }
  const spanish = rankCatalogQuery("learn spanish", catalog);
  assert.equal(spanish.useCases[0]?.slug, "learn-language");
  assert.ok(spanish.tools.some((tool) => tool.slug === "duolingo-max"));
  assert.equal(spanish.tools.some((tool) => tool.slug === "synthesis-tutor"), false);
  assert.equal(spanish.tools.some((tool) => tool.slug === "quizlet"), false);
  for (const avatar of ["AI avatar video", "talking head video", "spokesperson video", "video of me talking without filming"]) {
    const ranked = rankCatalogQuery(avatar, catalog);
    assert.equal(ranked.useCases[0]?.slug, "avatar-video", avatar);
    const slugs = ranked.tools.map((tool) => tool.slug);
    for (const wanted of ["heygen", "synthesia", "d-id"]) assert.ok(slugs.includes(wanted), `${avatar} missing ${wanted}`);
    for (const banned of ["opus", "higgsfield", "seedance", "midjourney"]) {
      assert.equal(slugs.includes(banned), false, `${avatar} included ${banned}`);
    }
  }
  for (const listing of [
    "edit listing videos for real estate",
    "make a video tour of a house",
    "realtor video editing",
    "property walkthrough video",
  ]) {
    const ranked = rankCatalogQuery(listing, catalog);
    assert.equal(ranked.useCases[0]?.slug, "listing-videos", listing);
    const specialists = ranked.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
    assert.deepEqual(specialists.slice(0, 4), ["capcut", "kapwing", "descript", "canva"], listing);
    const descript = ranked.tools.find((tool) => tool.slug === "descript");
    assert.match(descript?.whyItHelps ?? "", /transcript/i, listing);
    assert.doesNotMatch(descript?.whyItHelps ?? "", /property photos/i, listing);
    assert.match(ranked.intro, /trim your walkthrough footage/);
    for (const banned of ["mashvisor", "acres", "propstream", "dealcheck", "midjourney", "higgsfield"]) {
      assert.equal(specialists.includes(banned), false, `${listing} included ${banned}`);
    }
  }
  const photos = rankCatalogQuery("turn listing photos into a video", catalog);
  assert.equal(photos.useCases[0]?.slug, "listing-videos");
  const photoSpecialists = photos.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
  assert.deepEqual(photoSpecialists.slice(0, 4), ["autoreel", "canva", "kapwing", "capcut"]);
  assert.match(photos.intro, /turn listing photos into a home tour/);
  const photoDescript = photos.tools.find((tool) => tool.slug === "descript");
  if (photoDescript) assert.match(photoDescript.whyItHelps, /property photos or clips/);
  const estate = rankCatalogQuery("best AI tool for real estate", catalog);
  assert.equal(estate.useCases[0]?.slug, "real-estate");
  assert.equal(estate.lead, "For finding AI tools for real estate, here's how each tool can help:");
  assert.match(estate.intro, /deal/);
  assert.match(estate.intro, /listing video/);
  assert.match(estate.intro, /outreach/);
  const estateSlugs = estate.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
  for (const wanted of ["dealcheck", "autoreel", "dealmachine", "acres", "propstream"]) {
    assert.ok(estateSlugs.includes(wanted), wanted);
  }
  const review = rankCatalogQuery("resume review", catalog);
  assert.equal(review.useCases[0]?.slug, "write-resume");
  const reviewSlugs = review.tools.filter((tool) => !tool.generalPurpose).map((tool) => tool.slug);
  for (const wanted of ["teal", "rezi", "kickresume"]) assert.ok(reviewSlugs.includes(wanted));
  for (const banned of ["metaview", "gem", "paradox"]) assert.equal(reviewSlugs.includes(banned), false);
  assert.equal(rankCatalogQuery("resume review for this applicant", catalog).useCases[0]?.slug, "hire-candidates");
  const meal = rankCatalogQuery("meal prep for the week", catalog);
  assert.match(meal.intro, /can't cook the week's meals/);
  const grocery = rankCatalogQuery("grocery list", catalog);
  assert.match(grocery.intro, /grocery list/);
  assert.equal(grocery.intro === meal.intro, false);
  const baby = rankCatalogQuery("name a baby", catalog);
  const club = rankCatalogQuery("start a book club", catalog);
  const business = rankCatalogQuery("AI for my small business", catalog);
  const frames = [meal, grocery, baby, club, business];
  for (const ranked of frames) {
    const assistants = ranked.tools.filter((tool) => tool.generalPurpose);
    assert.equal(assistants.length, 5);
    assert.equal(new Set(assistants.map((tool) => tool.whyItHelps)).size, 5);
  }
  const mealClaude = meal.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "";
  const groceryClaude = grocery.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "";
  const babyClaude = baby.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "";
  const clubClaude = club.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "";
  const businessClaude = business.tools.find((tool) => tool.slug === "claude")?.whyItHelps ?? "";
  assert.match(mealClaude, /meals/);
  assert.match(groceryClaude, /grocery list/);
  assert.match(babyClaude, /baby names/);
  assert.match(clubClaude, /book/);
  assert.match(businessClaude, /customer reply|bookkeeping/);
  assert.equal(/step-by-step plan/i.test([mealClaude, groceryClaude, babyClaude, clubClaude, businessClaude].join(" ")), false);
  assert.equal(new Set([mealClaude, groceryClaude, babyClaude, clubClaude, businessClaude]).size, 5);
});

test("twitch highlight query ranks stream clip tools", () => {
  const ranked = rankCatalogQuery(
    "Create a highlight reel from my twitch streams",
    catalog,
  );
  const names = ranked.tools.map((tool) => tool.name);
  assert.ok(
    names.some((name) => /eklipse|opus clip|streamladder/i.test(name)),
    `expected a clip tool, got ${names.join(", ")}`,
  );
  assert.ok(
    !names.some((name) => /elevenlabs/i.test(name)),
    `voice tools should not rank for a highlight reel, got ${names.join(", ")}`,
  );
  assert.equal(ranked.fallback, false);
});

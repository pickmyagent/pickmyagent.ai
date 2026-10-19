import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import test from "node:test";
import { CONCEPTS } from "../lib/concepts.ts";
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
  assert.match(ranked.intro, /^AI agents can research, compare, summarize, draft, and automate/);
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
    assert.match(ranked.intro, /AI agents/);
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
  "AI agents can help you find and rank real estate deals by researching, comparing, and analyzing.";

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
    useCase: null,
    intro: /find and rank real estate deals/,
    exactIntro: REAL_ESTATE_RANK_INTRO,
  },
  {
    query: "rank rental properties by cash flow",
    useCase: null,
    intro: /rank rental properties by cash flow/,
  },
  {
    query: "score houses to flip",
    useCase: null,
    intro: /score houses to flip/,
  },
  {
    query: "find commercial real estate deals",
    useCase: null,
    intro: /commercial real estate deals/,
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
    intro: /content/,
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
  for (const tool of ranked.tools) {
    const why = tool.whyItHelps.toLowerCase();
    assert.ok(tool.whyItHelps.trim().length > 0, `${query} / ${tool.name} is missing a why-line`);
    assert.ok(
      tokens.some((token) => why.includes(token)),
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
  assert.equal(ranked.lead, jobLead(job.query), job.query);
  assert.match(ranked.intro, /^AI agents\b/, `${job.query} intro: ${ranked.intro}`);
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
  const landTools = ["acres", "land-id", "mashvisor", "regrid", "propstream"];
  assert.equal(
    ranked.tools.some((tool) => landTools.includes(tool.slug)),
    false,
    ranked.tools.map((tool) => tool.slug).join(", "),
  );
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
  { query: "find real estate deals and score them", expect: null },
  { query: "rank houses by cash flow", expect: null },
  { query: "a lot of deals", expect: null },
  { query: "wheres a good wedding venue", expect: null },
];

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

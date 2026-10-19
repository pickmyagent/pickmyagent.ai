import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { GENERIC_MATCH_WORDS, queryTokens, rankCatalogQuery, type RankedSearch } from "../lib/search.ts";
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

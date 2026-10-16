import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rankCatalogQuery } from "../lib/search.ts";
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

test("every tool has one strength and one weakness", () => {
  assert.equal(catalog.tools.length, 45);
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

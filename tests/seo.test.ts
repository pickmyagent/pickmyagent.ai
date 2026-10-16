import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { verifiedOffers } from "../lib/offers.ts";
import { CANONICAL_ORIGIN } from "../lib/seo.ts";
import type { Catalog } from "../lib/types.ts";

const catalog = JSON.parse(
  readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8"),
) as Catalog;

test("canonical origin is the www site", () => {
  assert.equal(CANONICAL_ORIGIN, "https://www.pickmyagent.ai");
  assert.equal(catalog.site.url, CANONICAL_ORIGIN);
});

test("tool titles and descriptions are unique", () => {
  const names = new Set<string>();
  const descriptions = new Set<string>();
  for (const tool of catalog.tools) {
    assert.equal(names.has(tool.name), false, tool.name);
    assert.equal(descriptions.has(tool.shortDescription), false, tool.shortDescription);
    names.add(tool.name);
    descriptions.add(tool.shortDescription);
  }
  assert.equal(names.size, catalog.tools.length);
});

test("n8n has no USD monthly price", () => {
  const n8n = catalog.tools.find((tool) => tool.id === "n8n");
  assert.ok(n8n);
  assert.equal(n8n.startingPrice, null);
  assert.equal(n8n.freeTier, null);
  assert.equal(verifiedOffers(n8n), undefined);
});

test("verified monthly prices become SoftwareApplication offers", () => {
  const opus = catalog.tools.find((tool) => tool.id === "opus");
  assert.ok(opus);
  const offers = verifiedOffers(opus);
  const list = Array.isArray(offers) ? offers : offers ? [offers] : [];
  assert.ok(list.some((offer) => offer.price === "15" && offer.priceCurrency === "USD"));
  assert.ok(list.some((offer) => offer.price === "0" && offer.priceCurrency === "USD"));
});

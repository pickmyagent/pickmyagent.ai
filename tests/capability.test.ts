import assert from "node:assert/strict";
import test from "node:test";
import { pickCapabilities, toolFamily } from "../lib/capability-match.ts";
import { wasmSessionPlan } from "../lib/wasm-runtime.ts";
import type { Tool } from "../lib/types.ts";

function tool(partial: Partial<Tool> & Pick<Tool, "slug" | "name" | "categories" | "capabilities">): Tool {
  return {
    id: partial.slug,
    websiteUrl: "https://example.com/",
    affiliateUrl: null,
    shortDescription: partial.name,
    longDescription: partial.name,
    useCaseTags: partial.useCaseTags ?? [],
    toolTypes: ["other"],
    platforms: ["web"],
    pricingModel: ["contact"],
    pricingNotes: "See site",
    pricingUrl: null,
    docsUrl: null,
    startingPrice: null,
    freeTrial: null,
    pricingCheckedAt: "2026-10-29",
    freeTier: null,
    freeTierNotes: null,
    openSource: false,
    repoUrl: null,
    bestFor: [],
    notIdealFor: [],
    strength: `${partial.name} can help with the listed jobs in this directory.`,
    weakness: "You still review the output before a customer sees it.",
    smokeStatus: "verified-docs-only",
    smokeTested: false,
    checkedAt: "2026-10-29T00:00:00Z",
    checkedDate: "2026-10-29",
    smokeTestNotes: null,
    handsOn: { performed: false },
    latestRelease: null,
    problems: [],
    featured: false,
    featuredPaid: false,
    status: "published",
    publishedAt: "2026-10-29",
    updatedAt: "2026-10-29",
    sources: [],
    siteLoad: { status: 200, finalUrl: "https://example.com/" },
    ...partial,
  };
}

const logo = tool({
  slug: "logo-shop",
  name: "Logo Shop",
  categories: ["design"],
  capabilities: [
    "design a logo for a small business",
    "generate a brand kit from a name",
    "export logo files",
    "pick colors and fonts",
    "create a business card from a logo",
  ],
});

const game = tool({
  slug: "npc-lab",
  name: "NPC Lab",
  categories: ["gaming"],
  capabilities: [
    "build a game npc with dialogue",
    "remember what the player said",
    "prototype a character for a game",
    "add memory to a game character",
    "write branching dialogue",
  ],
});

test("logo search stays on design tools", () => {
  const picks = pickCapabilities("design a logo for my coffee cart", [logo, game]);
  assert.equal(picks[0]?.slug, "logo-shop");
  assert.equal(picks.some((pick) => pick.slug === "npc-lab"), false);
});

test("land wording does not return a game builder", () => {
  const picks = pickCapabilities("find vacant land with zoning", [logo, game]);
  assert.equal(picks.some((pick) => pick.slug === "npc-lab"), false);
});

test("a typo still matches the logo job", () => {
  const picks = pickCapabilities("design a logoo for the coffee cart", [logo, game]);
  assert.equal(picks[0]?.slug, "logo-shop");
});

test("wasm stays single threaded for iOS Safari", () => {
  const plan = wasmSessionPlan({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    crossOriginIsolated: false,
  });
  assert.equal(plan.numThreads, 1);
  assert.equal(plan.proxy, false);
  assert.equal(plan.fileStem, "ort-wasm-simd-threaded.asyncify");
  assert.equal(toolFamily(game), "games");
});

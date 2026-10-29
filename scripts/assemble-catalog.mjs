/**
 * Bundles content/tools, content/use-cases, categories, and site
 * into content/catalog.json and checks the honesty rules.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SMOKE = new Set([
  "tested-hands-on",
  "verified-docs-only",
  "untested",
]);
const TOOL_TYPES = new Set([
  "agent",
  "framework",
  "copilot",
  "automation",
  "model_api",
  "creative",
  "infra",
  "other",
]);
const PRICING = new Set([
  "free",
  "freemium",
  "subscription",
  "usage",
  "open_source",
  "enterprise",
  "contact",
]);
const STATUSES = new Set(["draft", "published", "deprecated", "dead_link"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readDirJson(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => readJson(path.join(dir, name)));
}

function fail(message) {
  console.error(`catalog: ${message}`);
  process.exitCode = 1;
}

const site = readJson(path.join(root, "content/site.json"));
const categories = readJson(path.join(root, "content/categories.json"));
const tools = readDirJson(path.join(root, "content/tools"));
const useCases = readDirJson(path.join(root, "content/use-cases"));

const categorySlugs = new Set(categories.map((category) => category.slug));
const ids = new Set();
const slugs = new Set();

if (!/^\d{4}-\d{2}-\d{2}$/.test(site.catalogCheckedDate)) {
  fail("site.catalogCheckedDate must be YYYY-MM-DD");
}
if (site.newThisWeekSince > site.catalogCheckedDate) {
  fail("newThisWeekSince is after the catalog check date");
}
if (site.recentReleaseSince > site.newThisWeekSince) {
  fail("recentReleaseSince must be on or before newThisWeekSince");
}

for (const tool of tools) {
  if (ids.has(tool.id)) fail(`duplicate id ${tool.id}`);
  ids.add(tool.id);
  if (slugs.has(tool.slug)) fail(`duplicate slug ${tool.slug}`);
  slugs.add(tool.slug);
  if (!tool.name || !tool.websiteUrl?.startsWith("https://")) {
    fail(`${tool.id} needs a name and https websiteUrl`);
  }
  if (tool.affiliateUrl) {
    fail(`${tool.id} has an affiliate URL. Disclose it in the UI before shipping.`);
  }
  if (
    typeof tool.shortDescription !== "string" ||
    tool.shortDescription.length === 0 ||
    tool.shortDescription.length > 160
  ) {
    fail(`${tool.id} shortDescription must be 1–160 characters`);
  }
  if (!SMOKE.has(tool.smokeStatus)) fail(`${tool.id} has a bad smokeStatus`);
  const handsOn = tool.smokeStatus === "tested-hands-on";
  if (tool.smokeTested !== handsOn) {
    fail(`${tool.id} smokeTested must be true only for tested-hands-on`);
  }
  if (handsOn) {
    if (!tool.handsOn?.performed) {
      fail(`${tool.id} is tested-hands-on without handsOn.performed`);
    }
    if (tool.handsOn.llmCall || tool.handsOn.accountSignup || tool.handsOn.payment) {
      fail(`${tool.id} hands-on record includes a model call, signup, or payment`);
    }
    if (!tool.checkedDate) fail(`${tool.id} is missing checkedDate`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tool.checkedDate)) {
    fail(`${tool.id} checkedDate must be YYYY-MM-DD`);
  }
  if (!("startingPrice" in tool)) fail(`${tool.id} needs startingPrice`);
  if (
    tool.startingPrice !== null &&
    (typeof tool.startingPrice !== "number" ||
      !Number.isFinite(tool.startingPrice) ||
      tool.startingPrice < 0)
  ) {
    fail(`${tool.id} startingPrice must be a non-negative number or null`);
  }
  if (!("freeTrial" in tool)) fail(`${tool.id} needs freeTrial`);
  if (tool.freeTrial !== null && typeof tool.freeTrial !== "string") {
    fail(`${tool.id} freeTrial must be a string or null`);
  }
  if (!("pricingCheckedAt" in tool)) fail(`${tool.id} needs pricingCheckedAt`);
  if (
    tool.pricingCheckedAt !== null &&
    !/^\d{4}-\d{2}-\d{2}$/.test(tool.pricingCheckedAt)
  ) {
    fail(`${tool.id} pricingCheckedAt must be YYYY-MM-DD or null`);
  }
  if (tool.freeTier !== true && tool.freeTier !== false && tool.freeTier !== null) {
    fail(`${tool.id} freeTier must be true, false, or null`);
  }
  for (const field of ["strength", "weakness"]) {
    const value = tool[field];
    if (typeof value !== "string" || value.length < 40 || value.length > 320) {
      fail(`${tool.id} ${field} must be one sentence of 40–320 characters`);
    }
    if (value.includes("\n") || !value.endsWith(".")) {
      fail(`${tool.id} ${field} must be a single sentence ending with a period`);
    }
    const body = value.slice(0, -1).replace(/\d+(?:\.\d+)+/g, "");
    if (/[.!?]/.test(body)) {
      fail(`${tool.id} ${field} must be one sentence`);
    }
  }
  if (tool.featuredPaid && !tool.featured) {
    fail(`${tool.id} featuredPaid requires featured`);
  }
  if (!STATUSES.has(tool.status)) fail(`${tool.id} has a bad status`);
  for (const type of tool.toolTypes) {
    if (!TOOL_TYPES.has(type)) fail(`${tool.id} has tool type ${type}`);
  }
  for (const model of tool.pricingModel) {
    if (!PRICING.has(model)) fail(`${tool.id} has pricing model ${model}`);
  }
  for (const category of tool.categories) {
    if (!categorySlugs.has(category)) {
      fail(`${tool.id} has unknown category ${category}`);
    }
  }
  if (tool.openSource === true && !tool.pricingModel.includes("open_source")) {
    fail(`${tool.id} is open source but pricingModel omits open_source`);
  }
  if (!Array.isArray(tool.capabilities) || tool.capabilities.length < 5 || tool.capabilities.length > 15) {
    fail(`${tool.id} needs 5 to 15 capabilities`);
  } else {
    const seenCaps = new Set();
    for (const capability of tool.capabilities) {
      if (typeof capability !== "string" || capability.length < 12 || capability.length > 160) {
        fail(`${tool.id} capability must be 12–160 characters`);
        continue;
      }
      const key = capability.toLowerCase();
      if (seenCaps.has(key)) fail(`${tool.id} repeats a capability`);
      seenCaps.add(key);
    }
  }
}

for (const useCase of useCases) {
  if (!useCase.slug || !useCase.title || !useCase.summary) {
    fail("use case is missing slug, title, or summary");
  }
  const count = useCase.recommended?.length ?? 0;
  if (count > 5) {
    fail(`${useCase.slug} needs at most 5 recommended tools, found ${count}`);
  }
  const seen = new Set();
  for (const rec of useCase.recommended) {
    if (seen.has(rec.toolId)) fail(`${useCase.slug} repeats ${rec.toolId}`);
    seen.add(rec.toolId);
    const tool = tools.find((item) => item.id === rec.toolId);
    if (!tool) fail(`${useCase.slug} recommends missing tool ${rec.toolId}`);
    if (tool.smokeStatus === "untested") {
      fail(`${useCase.slug} recommends untested tool ${tool.id}`);
    }
    const tagged = tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag));
    if (!tagged) {
      fail(`${tool.id} is recommended for ${useCase.slug} without a matching tag`);
    }
    if (!rec.why || rec.why.length < 20) {
      fail(`${useCase.slug} / ${rec.toolId} needs a why sentence`);
    }
    if (!tool.generalPurpose && !tool.useCaseFit?.[useCase.slug]) {
      fail(`${tool.id} needs a useCaseFit line for ${useCase.slug}`);
    }
  }
  if (typeof useCase.intro !== "string" || !useCase.intro.startsWith("AI agents")) {
    fail(`${useCase.slug} needs an intro sentence that starts with "AI agents"`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

const catalog = {
  site,
  categories,
  tools,
  useCases,
};

fs.writeFileSync(
  path.join(root, "content/catalog.json"),
  `${JSON.stringify(catalog, null, 2)}\n`,
);

const handsOn = tools.filter((tool) => tool.smokeStatus === "tested-hands-on").length;
const docs = tools.filter((tool) => tool.smokeStatus === "verified-docs-only").length;
const untested = tools.filter((tool) => tool.smokeStatus === "untested").length;
console.log(
  `catalog.json: ${tools.length} tools (${handsOn} smoke-tested, ${docs} docs checked, ${untested} not fully checked), ${useCases.length} use cases.`,
);

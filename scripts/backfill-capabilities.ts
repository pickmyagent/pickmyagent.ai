import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { articleVerbProblems, hasLowercaseI } from "../lib/header-grammar.ts";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIR = path.join(ROOT, "content/tools");

const THIRD: Record<string, string> = {
  shows: "show", turns: "turn", helps: "help", drafts: "draft", runs: "run",
  searches: "search", answers: "answer", plans: "plan", edits: "edit", creates: "create",
  makes: "make", builds: "build", writes: "write", tracks: "track", flags: "flag",
  schedules: "schedule", generates: "generate", compares: "compare", organizes: "organize",
  collects: "collect", reads: "read", cuts: "cut", lets: "let", takes: "take",
  converts: "convert", renders: "render", lists: "list", finds: "find", ranks: "rank",
  scores: "score", pulls: "pull", nurtures: "nurture", screens: "screen", sources: "source",
  manages: "manage", automates: "automate", connects: "connect", reviews: "review",
  transcribes: "transcribe", clips: "clip", routes: "route", tutors: "tutor",
  practices: "practice", opens: "open", drives: "drive", captures: "capture",
  sends: "send", files: "file", sorts: "sort", matches: "match", cleans: "clean",
  summarizes: "summarize", analyzes: "analyze", monitors: "monitor", qualifies: "qualify",
  designs: "design", stages: "stage", composes: "compose", publishes: "publish",
  extracts: "extract", classifies: "classify", reconciles: "reconcile",
  categorizes: "categorize", handles: "handle", supports: "support", teaches: "teach",
  explains: "explain", clips2: "clip", produces: "produce", records: "record",
  books: "book", fills: "fill", checks: "check", watches: "watch", spots: "spot",
  removes: "remove", upscales: "upscale", clones: "clone", narrates: "narrate",
  translates: "translate", localizes: "localize", estimates: "estimate",
  calculates: "calculate", forecasts: "forecast", budgets: "budget", invoices: "invoice",
  reconciles2: "reconcile", nurtures3: "nurture",
};

const GERUND: Record<string, string> = {
  looking: "look", viewing: "view", drafting: "draft", editing: "edit", writing: "write",
  making: "make", building: "build", creating: "create", generating: "generate",
  finding: "find", tracking: "track", managing: "manage", running: "run",
  scheduling: "schedule", sending: "send", turning: "turn", comparing: "compare",
  organizing: "organize", collecting: "collect", reading: "read", cutting: "cut",
  pulling: "pull", screening: "screen", sourcing: "source", reviewing: "review",
  clipping: "clip", designing: "design", staging: "stage", automating: "automate",
  connecting: "connect", answering: "answer", planning: "plan", searching: "search",
  summarizing: "summarize", analyzing: "analyze", monitoring: "monitor",
  qualifying: "qualify", capturing: "capture", cleaning: "clean", sorting: "sort",
  matching: "match", filing: "file", reconciling: "reconcile", categorizing: "categorize",
  tutoring: "tutor", practicing: "practice", rendering: "render", converting: "convert",
  removing: "remove", translating: "translate", estimating: "estimate",
  calculating: "calculate", recording: "record", producing: "produce",
  handling: "handle", supporting: "support", teaching: "teach", explaining: "explain",
  checking: "check", filling: "fill", booking: "book", publishing: "publish",
  composing: "compose", extracting: "extract", classifying: "classify",
};

const SKIP_LEAD = new Set(["list", "offer", "include", "price", "cost", "charge", "bill", "say", "describe", "start"]);
const BANNED = /[;]|—|\bsample\b|\bimport\b|\bpackage\b|\bHTTP\b|\b\d{4}-\d{2}-\d{2}\b|\bnot a\b|\bis for\b|\binstead of\b|\bso you can\b|\bfetched\b|\bunconfirmed\b|\breturns\b/i;
const TAIL = new Set(["a", "an", "the", "or", "and", "with", "of", "to", "for", "in", "on", "from", "by"]);

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function leadVerb(first: string): string | null {
  const bare = first.toLowerCase().replace(/[^a-z]/g, "");
  return THIRD[bare] ?? GERUND[bare] ?? null;
}

function accept(capability: string): string | null {
  const text = capability.replace(/\s+/g, " ").replace(/[.?!]+$/g, "").trim().toLowerCase();
  const words = text.split(" ").filter(Boolean);
  if (words.length < 4 || words.length > 24) return null;
  if (SKIP_LEAD.has(words[0] ?? "")) return null;
  if (TAIL.has(words[words.length - 1] ?? "")) return null;
  if (/\band returns\b|\band shows\b|\band includes\b|\band renders\b|\band adds\b|\band lets\b/.test(text)) return null;
  if (BANNED.test(text)) return null;
  if (/\b(your|our|my)\b/.test(text)) return null;
  if (articleVerbProblems(`Tool can ${text}.`).length > 0) return null;
  if (hasLowercaseI(text)) return null;
  if (/\$\d/.test(text) && words.filter((word) => !/\d/.test(word) && word.length > 3).length < 4) return null;
  return text;
}

function fromClause(clause: string, name: string): string | null {
  let text = clause.replace(/\s+/g, " ").trim();
  text = text.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
  text = text.replace(/^(?:it|they|this|that|which|who)\s+/i, "");
  const can = text.match(/\b(?:can|will|to)\s+([a-z][\s\S]+)$/i);
  if (can) text = can[1] ?? text;
  const parts = text.replace(/[.?!]+$/g, "").split(/\s+/);
  const verb = leadVerb(parts[0] ?? "");
  if (!verb) return null;
  return accept(`${verb} ${parts.slice(1).join(" ")}`.replace(/\s+and returns\b/g, " and return"));
}

function explode(capability: string): string[] {
  const match = capability.match(/^(.*?\b)((?:(?:a|an|the)\s+)?[a-z0-9-]+(?:\s+[a-z0-9-]+){0,2}(?:,\s+(?:(?:a|an|the)\s+)?[a-z0-9-]+(?:\s+[a-z0-9-]+){0,2})*,?\s+or\s+(?:(?:a|an|the)\s+)?[a-z0-9-]+(?:\s+[a-z0-9-]+){0,2})(\s+(?:into|for|with|from)\s+.+)$/i);
  if (!match) return [capability];
  const prefix = match[1] ?? "";
  const list = match[2] ?? "";
  const suffix = match[3] ?? "";
  const items = list.split(/,|\bor\b/i).map((item) => item.trim()).filter((item) => item.split(/\s+/).length >= 1);
  const out = [capability];
  for (const item of items) {
    const next = accept(`${prefix}${item}${suffix}`.replace(/\s+/g, " "));
    if (next) out.push(next);
  }
  return out;
}

function collect(tool: Record<string, unknown>): string[] {
  const name = String(tool.name ?? "");
  const blobs: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string") blobs.push(value);
  };
  push(tool.strength);
  push(tool.longDescription);
  push(tool.shortDescription);
  for (const item of (tool.bestFor as string[] | undefined) ?? []) push(item);
  const fit = tool.useCaseFit as Record<string, string> | undefined;
  if (fit) for (const item of Object.values(fit)) push(item);
  const caps: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | null) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    caps.push(value);
  };
  for (const blob of blobs) {
    for (const sentence of blob.split(/(?<=[.!?])\s+/)) {
      const base = fromClause(sentence, name);
      if (!base) continue;
      for (const item of explode(base)) add(item);
    }
  }
  if (caps.length < 5) {
    const pads: string[] = [];
    for (const blob of blobs) {
      let text = blob.replace(/\$[\d,.]+/g, "").replace(/\([^)]*\)/g, "").replace(/[.?!]+$/g, "").trim();
      text = text.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i"), "");
      text = text.replace(/^(?:a|an|the)\s+/i, "");
      const padded = accept(`handle ${text.charAt(0).toLowerCase()}${text.slice(1)}`);
      if (padded) pads.push(padded);
    }
    for (const padded of pads) add(padded);
  }
  return caps.slice(0, 12);
}

const files = readdirSync(DIR).filter((name) => name.endsWith(".json")).sort();
let short = 0;
for (const file of files) {
  const full = path.join(DIR, file);
  const tool = JSON.parse(readFileSync(full, "utf8")) as Record<string, unknown>;
  const caps = collect(tool);
  if (caps.length < 5) {
    short += 1;
    delete tool.capabilities;
    writeFileSync(full, `${JSON.stringify(tool, null, 2)}\n`);
    console.log(`SHORT ${caps.length} ${file}`);
    for (const cap of caps) console.log(`  - ${cap}`);
    continue;
  }
  tool.capabilities = caps;
  writeFileSync(full, `${JSON.stringify(tool, null, 2)}\n`);
}
console.log(`ready ${files.length - short}, short ${short}`);

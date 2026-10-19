import { CONCEPT_THRESHOLD, CONCEPTS, type Concept } from "./concepts.ts";
import type { Category, SmokeStatus, Tool, UseCase } from "./types";

/**
 * Matching is BM25 plus a concept lexicon, computed in the page.
 * A MiniLM ONNX model is about 23MB plus the WASM runtime. That download,
 * and the first inference after it is cached, is not reliably under 1.5s
 * on a phone, and embedding on the server would spend a Hobby function.
 * This ranker is the same code the build tests run, with no network call.
 */

const STOPWORDS = new Set([
  "a", "an", "the", "my", "your", "our", "from", "of", "in", "on", "with", "and",
  "or", "to", "for", "into", "that", "this", "it", "is", "are", "be", "do", "me",
  "i", "we", "you", "what", "how", "please", "some", "any", "just", "can", "via",
  "by", "at", "as", "if", "so", "than", "then", "but", "about", "trying", "using",
  "want", "need", "im", "its", "create", "make", "might", "not", "yet", "have",
  "has", "them", "will", "does", "only", "when",
]);

/** Generic verbs and the word "agent" do not count as a match. */
export const GENERIC_MATCH_WORDS = ["find", "build", "help", "agent", "need", "make"] as const;
const GENERIC = new Set<string>(GENERIC_MATCH_WORDS);
for (const word of GENERIC_MATCH_WORDS) STOPWORDS.add(word);
STOPWORDS.add("agents");

const SYNONYM_GROUPS = [
  ["twitch", "stream", "streams", "streamer", "streamers", "streaming", "vod", "livestream", "kick"],
  ["highlight", "highlights", "clip", "clips", "clipping", "reel", "reels", "shorts", "short"],
  ["video", "videos", "youtube", "film", "movie", "movies", "cinematic"],
  ["email", "inbox", "gmail", "mail"],
  ["automate", "automation", "automated", "automating", "workflow", "workflows"],
];

const SYNONYMS = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const set = new Set(group);
  for (const word of group) SYNONYMS.set(word, set);
}

const CLIP_TERMS = SYNONYMS.get("clip") ?? new Set<string>();

const HEADER_ONLY_GERUNDS: Record<string, string> = {
  do: "doing",
  act: "acting",
  support: "supporting",
};

const GERUNDS: Record<string, string> = {
  clip: "clipping", make: "making", edit: "editing", write: "writing", plan: "planning",
  train: "training", organize: "organizing", bake: "baking", reach: "reaching",
  contact: "contacting", text: "texting", automate: "automating", create: "creating",
  generate: "generating", build: "building", cut: "cutting", find: "finding",
  manage: "managing", rank: "ranking", score: "scoring", book: "booking", shop: "shopping",
  debug: "debugging", refactor: "refactoring", ship: "shipping", synthesize: "synthesizing",
  monitor: "monitoring", process: "processing", answer: "answering", resolve: "resolving",
  schedule: "scheduling", analyze: "analyzing", screen: "screening", source: "sourcing",
  qualify: "qualifying", turn: "turning", run: "running", optimize: "optimizing",
  draft: "drafting", summarize: "summarizing", compare: "comparing", track: "tracking",
  handle: "handling", orchestrate: "orchestrating", design: "designing", cook: "cooking",
  call: "calling", recommend: "recommending",
};

const ACTION_VERBS = Object.keys(GERUNDS);

const CAPABILITY_ORDER = [
  "research", "compare", "summarize", "draft", "automate", "track", "schedule", "analyze", "monitor",
] as const;

const VERB_CAPABILITIES: Record<string, string[]> = {
  find: ["research", "compare"],
  rank: ["analyze", "compare"],
  score: ["analyze", "compare"],
  shop: ["compare", "research"],
  recommend: ["compare", "research"],
  plan: ["schedule", "research"],
  book: ["schedule", "compare"],
  write: ["draft"],
  manage: ["track", "automate"],
  contact: ["draft"],
  reach: ["draft"],
  text: ["draft"],
  debug: ["analyze"],
  refactor: ["analyze"],
  ship: ["draft"],
  schedule: ["schedule"],
  analyze: ["analyze"],
  monitor: ["monitor"],
  automate: ["automate"],
  orchestrate: ["automate"],
  process: ["track", "analyze"],
  screen: ["compare", "analyze"],
  source: ["research"],
  qualify: ["compare", "research"],
  create: ["draft"],
  optimize: ["analyze", "draft"],
  summarize: ["summarize"],
  synthesize: ["summarize"],
  answer: ["research", "summarize"],
  resolve: ["draft"],
  handle: ["track", "draft"],
  turn: ["summarize"],
  run: ["automate"],
  edit: ["draft"],
  clip: ["draft"],
  generate: ["draft"],
  design: ["draft"],
  organize: ["track"],
  train: ["track"],
  call: ["draft"],
};

const DO_NOT_CORRECT = new Set([
  "deals", "deal", "house", "houses", "homes", "home", "rental", "rentals", "score",
  "rank", "flip", "commercial", "wedding", "cookbook", "garage", "property",
  "properties", "real", "estate", "cash", "flow", "reach", "realtor", "owner",
  "owners", "seller", "sellers", "plan", "write", "bake", "train", "organize",
]);

const ANCHOR_DICTIONARY = [...new Set(CONCEPTS.flatMap((concept) => concept.anchors))].filter(
  (word) => word.length >= 5,
);

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function queryTokens(query: string): string[] {
  return words(query).filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = a[i - 1] === b[j - 1]
        ? previous
        : 1 + Math.min(previous, row[j], row[j - 1]);
      previous = saved;
    }
  }
  return row[b.length];
}

function correctToken(token: string): string {
  if (token.length < 6 || STOPWORDS.has(token) || DO_NOT_CORRECT.has(token)) return token;
  if (ANCHOR_DICTIONARY.includes(token)) return token;
  let match: string | null = null;
  for (const candidate of ANCHOR_DICTIONARY) {
    if (candidate[0] !== token[0]) continue;
    if (editDistance(token, candidate) !== 1) continue;
    if (match) return token;
    match = candidate;
  }
  return match ?? token;
}

function correctedQuery(query: string): string {
  return query.replace(/[A-Za-z0-9]+/g, (token) => {
    const fixed = correctToken(token.toLowerCase());
    return fixed === token.toLowerCase() ? token : fixed;
  });
}

export function mentionsLand(query: string): boolean {
  const tokens = words(query);
  if (tokens.some((token) =>
    ["land", "parcel", "parcels", "acre", "acreage", "acres", "zoning", "lots"].includes(token)
  )) {
    return true;
  }
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index] === "lot" && tokens[index - 1] !== "a") return true;
  }
  return false;
}

function scoreConcept(concept: Concept, lower: string, tokens: Set<string>): number {
  if (concept.id === "land" && !mentionsLand(lower)) return 0;
  let score = 0;
  for (const phrase of concept.phrases) {
    if (lower.includes(phrase)) score += 12;
  }
  for (const anchor of concept.anchors) {
    if (tokens.has(anchor)) score += 8;
  }
  return score;
}

export function cleanUserPhrase(query: string): string {
  let text = query.trim().replace(/\s+/g, " ").replace(/[.?!]+$/g, "");
  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text.replace(/^(please\s+)?/i, "");
    text = text.replace(/^(i\s+)?(want|need)\s+(to\s+)?(help\s+)?(with\s+)?/i, "");
    text = text.replace(/^(an?\s+)?(ai\s+)?(agents?|tools?)\s+(that\s+will\s+|to\s+help\s+me\s+)/i, "");
    text = text.replace(/^(help\s+me\s+)/i, "");
    text = text.replace(/^(agents?\s+to\s+help\s+me\s+)/i, "");
  }
  text = text.replace(/\bmy\b/gi, "your");
  text = text.replace(/^(help\s+)/i, "");
  const headerGerunds = { ...GERUNDS, ...HEADER_ONLY_GERUNDS };
  text = text.replace(/(^|,\s*(?:and\s+)?|\band\s+)([A-Za-z]+)\b/g, (full, prefix: string, word: string) => {
    const gerund = headerGerunds[word.toLowerCase()];
    return gerund ? `${prefix}${gerund}` : full;
  });
  return text.replace(/\s+/g, " ").trim() || query.trim();
}

function extractPlace(query: string): string | null {
  const match = query.match(/\bin\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s*$/);
  if (!match) return null;
  const raw = match[1].trim();
  if (/^(the|a|my|your|order|general|mind)$/i.test(raw)) return null;
  return raw.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function jobLead(query: string): string {
  return `For ${cleanUserPhrase(query)}, here's how each tool can help:`;
}

function extractVerbs(query: string): string[] {
  const found: string[] = [];
  for (const token of words(query)) {
    if (ACTION_VERBS.includes(token) && !found.includes(token)) found.push(token);
  }
  return found.slice(0, 4);
}

function humanJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function objectPhrase(query: string, verbs: string[]): string {
  const headerGerunds = { ...GERUNDS, ...HEADER_ONLY_GERUNDS };
  const gerunds = new Set(verbs.map((verb) => headerGerunds[verb]).filter((item) => item));
  const drop = new Set(["and", "or", "them", "it"]);
  return cleanUserPhrase(query)
    .split(/\s+/)
    .filter((token) => {
      const bare = token.toLowerCase().replace(/[^a-z0-9]/g, "");
      return bare.length > 0 && !gerunds.has(bare) && !drop.has(bare);
    })
    .join(" ");
}

function capabilitiesFor(verbs: string[]): string[] {
  const picked = new Set<string>();
  for (const verb of verbs) {
    for (const capability of VERB_CAPABILITIES[verb] ?? ["research", "draft"]) {
      picked.add(capability);
    }
  }
  return CAPABILITY_ORDER.filter((capability) => picked.has(capability)).slice(0, 3);
}

function capabilityGerund(capability: string): string {
  if (capability === "summarize") return "summarizing";
  if (capability.endsWith("e") && !capability.endsWith("ee")) return `${capability.slice(0, -1)}ing`;
  return `${capability}ing`;
}

export function templatedIntro(query: string): string {
  const phrase = cleanUserPhrase(query);
  const verbs = extractVerbs(query);
  const specific = verbs.filter((verb) => !GENERIC.has(verb));
  if (specific.length === 0) {
    return `AI agents can research, compare, summarize, draft, and automate parts of ${phrase}.`;
  }
  const shown = verbs.filter((verb) => specific.includes(verb) || verb === "find");
  const object = objectPhrase(query, shown);
  const capabilities = capabilitiesFor(shown).map(capabilityGerund);
  const by = humanJoin(capabilities.length > 0 ? capabilities : ["researching", "comparing", "drafting"]);
  return `AI agents can help you ${humanJoin(shown)}${object ? ` ${object}` : ""} by ${by}.`;
}

function queryHasExtraIntent(query: string, concept: Concept): boolean {
  const place = extractPlace(query);
  const placeWords = new Set(place ? words(place) : []);
  const allowed = new Set(concept.covered);
  return queryTokens(query).some((token) => !allowed.has(token) && !placeWords.has(token));
}

function introBorrowsLand(intro: string, query: string): boolean {
  if (mentionsLand(query)) return false;
  return /\bland\b|\bparcels?\b|\bacres?\b|\bacreage\b|\blots?\b/i.test(intro);
}

export function jobIntro(query: string, useCase: UseCase | undefined, concept: Concept | null): string {
  const specific = extractVerbs(query).filter((verb) => !GENERIC.has(verb));
  const storedOk = Boolean(
    useCase?.intro &&
    concept &&
    !queryHasExtraIntent(query, concept) &&
    specific.every((verb) => concept.coveredVerbs.includes(verb)) &&
    !introBorrowsLand(useCase.intro, query),
  );
  if (storedOk && useCase?.intro) return useCase.intro;
  return templatedIntro(query);
}

function documentedLines(tool: Tool, useCaseSlug: string | null): string[] {
  const lines: string[] = [];
  const fit = useCaseSlug ? tool.useCaseFit?.[useCaseSlug]?.trim() : "";
  if (fit) lines.push(fit);
  if (tool.strength) lines.push(tool.strength);
  for (const item of tool.bestFor) lines.push(item);
  if (tool.shortDescription) lines.push(tool.shortDescription);
  return lines;
}

function usableCapability(line: string): string {
  const clauses = line
    .replace(/\bdocs checked\b[^.]*\.?/gi, "")
    .replace(/\bwe did not sign up\b\.?/gi, "")
    .split(/,\s*/);
  const kept = clauses.filter((clause) =>
    clause.trim().length > 0 &&
    !/\$|\bper\s+(?:month|mo|seat|user|year)\b|\bbilled\b|\bdocs checked\b|\bwhen no specialist\b/i.test(clause),
  );
  return kept.join(", ").replace(/\s+/g, " ").replace(/^,\s*|,\s*$/g, "").replace(/\.$/, "").trim();
}

function bestCapability(tool: Tool, useCaseSlug: string | null, query: string): string {
  const lines = documentedLines(tool, useCaseSlug);
  const wanted = new Set(queryTokens(query));
  let best = "";
  let bestScore = -1;
  for (const line of lines) {
    const capability = usableCapability(line);
    if (capability.length < 12) continue;
    const tokens = new Set(words(capability));
    let score = [...wanted].filter((token) => tokens.has(token)).length;
    if (useCaseSlug && line === tool.useCaseFit?.[useCaseSlug]) score += 2;
    if (score > bestScore) {
      best = capability;
      bestScore = score;
    }
  }
  return best || usableCapability(tool.bestFor[0] || tool.shortDescription);
}

function tidyPhrase(text: string): string {
  return text.replace(/\s+,/g, ",").replace(/[,\s]+$/g, "").replace(/\s+/g, " ").trim();
}

const INFINITIVES: Record<string, string> = {};
for (const [verb, gerund] of Object.entries({ ...GERUNDS, ...HEADER_ONLY_GERUNDS })) {
  INFINITIVES[gerund] = verb;
}

function toInfinitive(text: string): string {
  return text.replace(/(^|,\s*(?:and\s+)?|\band\s+)([A-Za-z]+)\b/g, (full, prefix: string, word: string) => {
    const infinitive = INFINITIVES[word.toLowerCase()];
    return infinitive ? `${prefix}${infinitive}` : full;
  });
}

/** Strip "find an agent that will" and similar wrappers. Leave the job underneath. */
function unwrapJob(query: string): string {
  let text = query.trim().replace(/\s+/g, " ").replace(/[.?!]+$/g, "");
  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text.replace(/^(please\s+)/i, "");
    text = text.replace(/^(i\s+)?(want|need)\s+(to\s+)?/i, "");
    text = text.replace(
      /^(?:find|get|looking\s+for)\s+(?:me\s+)?(?:an?\s+)?(?:ai\s+)?(?:agents?|tools?)\s+(?:that\s+(?:will|can)\s+|to\s+(?:help\s+me\s+)?)?/i,
      "",
    );
    text = text.replace(/^(?:an?\s+)?(?:ai\s+)?(?:agents?|tools?)\s+(?:that\s+(?:will|can)\s+|to\s+help\s+me\s+)/i, "");
    text = text.replace(/^help\s+me\s+(?:to\s+)?/i, "");
    text = text.replace(/^help\s+/i, "");
    text = text.replace(/^(?:agents?\s+)?to\s+help\s+me\s+/i, "");
    text = text.replace(/^find\s+me\s+/i, "find ");
  }
  text = text.replace(/\bmy\b/gi, "your");
  text = text.replace(/^(?:to\s+)/i, "");
  return toInfinitive(text).replace(/\s+/g, " ").trim();
}

function shortObject(text: string, verbs: string[]): string {
  const verbSet = new Set(verbs);
  const drop = new Set([
    "and", "or", "them", "it", "a", "an", "the", "to", "that", "this", "when", "only",
    "do", "act",
  ]);
  const kept: string[] = [];
  let content = 0;
  for (const raw of text.replace(/[()]/g, " ").split(/\s+/)) {
    const bare = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!bare || verbSet.has(bare) || drop.has(bare) || GENERIC.has(bare)) continue;
    if (bare.length < 3) continue;
    kept.push(bare === "your" ? "your" : raw.replace(/[^A-Za-z0-9-]/g, ""));
    if (bare !== "your") content += 1;
    if (content >= 4) break;
  }
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function infinitiveJob(query: string): string {
  const unwrapped = unwrapJob(query);
  const verbs = extractVerbs(unwrapped);
  const specific = verbs.filter((verb) => !GENERIC.has(verb));
  const shown = specific.length > 0 ? verbs.filter((verb) => specific.includes(verb) || verb === "find") : [];
  if (shown.length === 0) {
    const phrase = unwrapped
      .replace(/\bfind an (?:ai )?(?:agent|tool) that will\b/gi, "")
      .replace(/\bfind an (?:ai )?(?:agent|tool)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    return tidyPhrase(phrase) || "work through this";
  }
  const object = shortObject(unwrapped, shown);
  return tidyPhrase(`${humanJoin(shown)}${object ? ` ${object}` : ""}`);
}

function jobEndings(query: string): string[] {
  if (/\btaxes?\b/i.test(query)) {
    return ["file your taxes", "get your taxes done", "finish your taxes", "complete your taxes"];
  }
  const base = infinitiveJob(query).replace(/\bfind an agent\b/gi, "").replace(/\s+/g, " ").trim();
  const endings = [base];
  const withoutFind = base.replace(/^find and\s+/i, "");
  if (withoutFind && withoutFind !== base) endings.push(withoutFind);
  const swapped = base.match(/^(\w+) and (\w+) (.+)$/);
  if (swapped) endings.push(`${swapped[1]} ${swapped[3]} and ${swapped[2]} them`);
  if (/^manage\b/i.test(base)) endings.push(base.replace(/^manage\b/i, "clear"));
  if (base && !/\byourself\b/i.test(base)) endings.push(`${base} yourself`);
  return [...new Set(endings.map((item) => tidyPhrase(item)).filter(Boolean))];
}

function lowerFirst(text: string): string {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

type TaskKind = "plan" | "compare" | "research" | "draft" | "analyze" | "schedule";

const KIND_FROM_VERB: Record<string, TaskKind> = {
  plan: "plan", organize: "plan", manage: "plan", handle: "plan", automate: "plan",
  orchestrate: "plan", run: "plan", train: "plan", bake: "plan", cook: "plan",
  rank: "analyze", score: "analyze", analyze: "analyze", debug: "analyze",
  refactor: "analyze", monitor: "analyze", process: "analyze", optimize: "analyze",
  compare: "compare", shop: "compare", screen: "compare", recommend: "compare", qualify: "compare",
  write: "draft", draft: "draft", contact: "draft", reach: "draft", text: "draft",
  edit: "draft", generate: "draft", create: "draft", ship: "draft", turn: "draft",
  call: "draft", design: "draft", clip: "draft", cut: "draft",
  schedule: "schedule", book: "schedule",
  find: "research", source: "research", answer: "research", summarize: "research", synthesize: "research",
};

function primaryKind(query: string): TaskKind {
  for (const verb of extractVerbs(unwrapJob(query))) {
    if (verb === "find") continue;
    const kind = KIND_FROM_VERB[verb];
    if (kind) return kind;
  }
  return "plan";
}

function kindsFor(primary: TaskKind): Record<string, TaskKind> {
  const claude: TaskKind = primary === "research" ? "plan" : primary;
  const used = new Set<TaskKind>([claude, "research"]);
  const open = (["draft", "compare", "analyze", "schedule", "plan"] as TaskKind[]).filter((kind) => !used.has(kind));
  return {
    claude,
    chatgpt: open[0] ?? "draft",
    gemini: open[1] ?? "compare",
    perplexity: "research",
  };
}

function withYour(object: string): string {
  if (!object) return "this job";
  if (/\byour\b/i.test(object)) return object;
  return `your ${object}`;
}

function focusNoun(query: string): string {
  const unwrapped = unwrapJob(query);
  const object = shortObject(unwrapped, extractVerbs(unwrapped));
  return withYour(object);
}

function nounHasJobToken(query: string, noun: string): boolean {
  const tokens = queryTokens(query).filter((token) => token.length > 3);
  if (tokens.length === 0) return true;
  const lower = noun.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

function isInboxJob(query: string): boolean {
  if (/\binbox\b/i.test(query)) return true;
  const unwrapped = unwrapJob(query);
  const words = shortObject(unwrapped, extractVerbs(unwrapped))
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word && word !== "your");
  return words.length > 0 && words.every((word) => word === "email" || word === "personal");
}

function specialTask(kind: TaskKind, query: string): string | null {
  if (/\bwedding\b/i.test(query)) {
    if (kind === "plan") return "turn your guest count and budget into a wedding vendor checklist with a timeline";
    if (kind === "compare") return "compare wedding venues and vendors in a side-by-side table";
    if (kind === "research") return "write a sourced summary of wedding venues from pages you can check";
    if (kind === "draft") return "draft a wedding email to a vendor";
    if (kind === "analyze") return "break the wedding budget into a spreadsheet";
    if (kind === "schedule") return "lay the wedding out as a calendar plan";
  }
  if (/\btaxes?\b/i.test(query)) {
    if (kind === "plan") return "turn your income and deductions into a checklist for your taxes";
    if (kind === "compare") return "compare filing options for your taxes in a side-by-side table";
    if (kind === "research") return "write a sourced summary of forms for your taxes from pages you can check";
    if (kind === "draft") return "draft questions about your taxes for a tax pro";
    if (kind === "analyze") return "break your taxes into a spreadsheet";
    if (kind === "schedule") return "lay filing dates for your taxes out as a calendar plan";
  }
  if (isInboxJob(query)) {
    if (kind === "plan") return "turn unread email threads into an inbox checklist with a timeline";
    if (kind === "compare") return "compare email threads in a side-by-side table";
    if (kind === "research") return "write a sourced summary of your email inbox from pages you can check";
    if (kind === "draft") return "draft a reply to an email in your inbox";
    if (kind === "analyze") return "break your email inbox into a spreadsheet of threads";
    if (kind === "schedule") return "lay email follow-ups out as a calendar plan";
  }
  return null;
}

function taskFor(kind: TaskKind, query: string): string {
  const special = specialTask(kind, query);
  if (special) return special;
  const noun = focusNoun(query);
  const job = infinitiveJob(query);
  if (nounHasJobToken(query, noun)) {
    if (kind === "plan") return `turn ${noun} into a checklist with a timeline`;
    if (kind === "compare") return `compare ${noun} in a side-by-side table`;
    if (kind === "research") return `write a sourced summary of ${noun} from pages you can check`;
    if (kind === "draft") return `draft an email about ${noun}`;
    if (kind === "analyze") return `break ${noun} into a spreadsheet`;
    return `lay ${noun} out as a calendar plan`;
  }
  if (kind === "plan") return `build a checklist with a timeline to ${job}`;
  if (kind === "compare") return `make a side-by-side table to ${job}`;
  if (kind === "research") return `write a sourced summary from pages you can check to ${job}`;
  if (kind === "draft") return `draft an email to help you ${job}`;
  if (kind === "analyze") return `make a spreadsheet breakdown to ${job}`;
  return `make a calendar plan to ${job}`;
}

function assistantWhy(tool: Tool, query: string): string {
  const name = tool.assistantName ?? tool.name.split("(")[0].trim();
  const kind = kindsFor(primaryKind(query))[tool.slug] ?? "plan";
  let task = taskFor(kind, query);
  if (tool.slug === "gemini" && !/google apps/i.test(task)) task = `${task} in Google apps`;
  return `Ask ${name} to ${task}.`;
}

function whyItHelps(tool: Tool, useCase: UseCase | null, query: string, general: boolean, index: number): string {
  if (general) return assistantWhy(tool, query);
  const capability = lowerFirst(bestCapability(tool, useCase?.slug ?? null, query));
  const first = capability.split(/\s+/)[0]?.toLowerCase() ?? "";
  const clause = INFINITIVES[first] ? `${tool.name} is for ${capability}` : `${tool.name} ${capability}`;
  const endings = jobEndings(query);
  const ending = endings[index % endings.length] ?? endings[0];
  return `${clause}, so you can ${ending}.`;
}

export type RankedTool = {
  slug: string;
  name: string;
  shortDescription: string;
  smokeStatus: SmokeStatus;
  checkedDate: string;
  score: number;
  whyItHelps: string;
  generalPurpose: boolean;
};

export type RankedUseCase = {
  slug: string;
  title: string;
  summary: string;
  toolCount: number;
  smokeTestedCount: number;
  score: number;
};

export type RankedSearch = {
  tools: RankedTool[];
  useCases: RankedUseCase[];
  fallback: boolean;
  lowMatch: boolean;
  lead: string;
  intro: string;
  disclaimer: string | null;
};

type IndexedTool = {
  slug: string;
  name: string;
  shortDescription: string;
  smokeStatus: SmokeStatus;
  checkedDate: string;
  score: number;
  categories: string[];
  useCaseTags: string[];
  tokens: string[];
  nameTokens: Set<string>;
  text: string;
  source: Tool;
};

function hitsClipTerms(text: string, tokens: Set<string>): boolean {
  if ([...tokens].some((token) => CLIP_TERMS.has(token))) return true;
  const lower = text.toLowerCase();
  for (const word of CLIP_TERMS) {
    if (word.length >= 4 && lower.includes(word)) return true;
  }
  return false;
}

function points(text: string, tokens: Set<string>, terms: string[], exact: number, synonym: number): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (STOPWORDS.has(term)) continue;
    if (tokens.has(term) || lower.includes(term)) {
      score += exact;
      continue;
    }
    const group = SYNONYMS.get(term);
    if (group && [...tokens].some((token) => group.has(token))) score += synonym;
  }
  return score;
}

function toolText(tool: Tool): string {
  return [tool.name, tool.shortDescription, tool.longDescription, tool.strength, ...tool.bestFor].join(" ");
}

export function textMatchesQuery(query: string, text: string): boolean {
  const terms = queryTokens(query);
  if (!query.trim() || terms.length === 0) return true;
  const tokens = new Set(words(text));
  return points(text, tokens, terms, 1, 1) > 0;
}

function bm25(queryTerms: string[], docTokens: string[], docs: string[][]): number {
  const k1 = 1.2;
  const b = 0.75;
  const average = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(docs.length, 1);
  const counts = new Map<string, number>();
  for (const token of docTokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  let score = 0;
  for (const term of new Set(queryTerms)) {
    const df = docs.filter((doc) => doc.includes(term)).length;
    if (df === 0) continue;
    const idf = Math.log((docs.length - df + 0.5) / (df + 0.5) + 1);
    const tf = counts.get(term) ?? 0;
    const denom = tf + k1 * (1 - b + b * (docTokens.length / Math.max(average, 1)));
    score += idf * ((tf * (k1 + 1)) / Math.max(denom, 0.001));
  }
  return score;
}

export function rankCatalogQuery(
  query: string,
  catalog: { tools: Tool[]; useCases: UseCase[]; categories: Category[] },
): RankedSearch {
  const published = catalog.tools.filter((tool) => tool.status === "published");
  const indexedTools: IndexedTool[] = published.map((tool) => {
    const text = toolText(tool);
    return {
      slug: tool.slug,
      name: tool.name,
      shortDescription: tool.shortDescription,
      smokeStatus: tool.smokeStatus,
      checkedDate: tool.checkedDate,
      score: 0,
      categories: tool.categories,
      useCaseTags: tool.useCaseTags,
      tokens: words(text),
      nameTokens: new Set(words(tool.name)),
      text,
      source: tool,
    };
  });
  const docTokens = indexedTools.map((tool) => tool.tokens);

  const indexedCases = catalog.useCases.map((useCase) => {
    const tagged = indexedTools.filter((tool) =>
      tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag)),
    );
    return {
      slug: useCase.slug,
      title: useCase.title,
      summary: useCase.summary,
      toolCount: tagged.length,
      smokeTestedCount: tagged.filter((tool) => tool.smokeStatus === "tested-hands-on").length,
      score: 0,
      source: useCase,
    };
  });

  if (!query.trim()) {
    return {
      tools: [],
      useCases: indexedCases.map(presentCase),
      fallback: false,
      lowMatch: false,
      lead: "",
      intro: "",
      disclaimer: null,
    };
  }

  const corrected = correctedQuery(query);
  const lower = corrected.toLowerCase();
  const tokens = new Set(words(corrected).map(correctToken));
  const rankedConcepts = CONCEPTS
    .map((concept) => ({ concept, score: scoreConcept(concept, lower, tokens) }))
    .filter((item) => item.score >= CONCEPT_THRESHOLD)
    .sort((a, b) => b.score - a.score);
  const specificConcepts = rankedConcepts.filter((item) => !item.concept.broad);
  const pool = specificConcepts.length > 0 ? specificConcepts : rankedConcepts;
  const top = pool[0];
  const tied = top ? pool.filter((item) => item.score === top.score) : [];
  const winner = tied.length === 1 ? top : null;
  if (winner?.concept.id === "video" && /\b(edit|editing|clip|clips|clipping|cut|make|making)\b/i.test(query)) {
    // Video editing is not a land search. Land is already gated on land words.
  }

  const terms = queryTokens(corrected);
  const queryWantsClips = terms.some((term) => CLIP_TERMS.has(term));
  const specialists: IndexedTool[] = [];
  if (winner) {
    const allowed = new Set(winner.concept.categories);
    const matchedCase = catalog.useCases.find((item) => item.slug === winner.concept.useCase);
    const matchTags = matchedCase?.matchTags ?? [winner.concept.useCase];
    const tagged = indexedTools.filter((tool) =>
      !tool.source.generalPurpose &&
      tool.useCaseTags.some((tag) => matchTags.includes(tag)) &&
      tool.categories.every((category) => allowed.has(category)),
    );
    for (const tool of tagged) {
      const ownTokens = new Set([...tool.nameTokens, ...tool.tokens]);
      if (queryWantsClips && !hitsClipTerms(`${tool.name} ${tool.text}`, ownTokens)) continue;
      if (
        winner.concept.id === "video" &&
        !/\b(video|videos|clip|clips|clipping|youtube|caption|captions|stream|streams|reel|reels|edit|editing)\b/i.test(
          `${tool.name} ${tool.text}`,
        )
      ) {
        continue;
      }
      const overlap = bm25(terms, tool.tokens, docTokens);
      const recIndex = winner ? indexedCases.find((item) => item.slug === winner.concept.useCase)
        ?.source.recommended.findIndex((item) => item.toolId === tool.source.id) ?? -1 : -1;
      const recBonus = recIndex >= 0 ? 8 - recIndex : 0;
      tool.score = winner.score * 10 + overlap + recBonus;
      specialists.push(tool);
    }
  }
  specialists.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const primaryCase = winner
    ? indexedCases.find((item) => item.slug === winner.concept.useCase) ?? null
    : null;
  if (primaryCase && winner) primaryCase.score = winner.score;

  const assistantOrder = ["claude", "chatgpt", "gemini", "perplexity"];
  const assistants = indexedTools
    .filter((tool) => tool.source.generalPurpose)
    .sort((a, b) => assistantOrder.indexOf(a.slug) - assistantOrder.indexOf(b.slug));
  const selected = [
    ...specialists.slice(0, 5),
    ...assistants.filter((tool) => !specialists.some((item) => item.slug === tool.slug)),
  ];
  const lowMatch = !winner;

  return {
    tools: selected.map((tool, index) =>
      presentTool(
        tool,
        whyItHelps(tool.source, primaryCase?.source ?? null, query, Boolean(tool.source.generalPurpose), index),
        Boolean(tool.source.generalPurpose),
      ),
    ),
    useCases: primaryCase ? [presentCase(primaryCase)] : [],
    fallback: lowMatch,
    lowMatch,
    lead: jobLead(query),
    intro: jobIntro(query, primaryCase?.source, winner?.concept ?? null),
    disclaimer: primaryCase?.source.disclaimer ?? null,
  };
}

function presentTool(tool: IndexedTool, why: string, generalPurpose: boolean): RankedTool {
  return {
    slug: tool.slug,
    name: tool.name,
    shortDescription: tool.shortDescription,
    smokeStatus: tool.smokeStatus,
    checkedDate: tool.checkedDate,
    score: tool.score,
    whyItHelps: why,
    generalPurpose,
  };
}

function presentCase(useCase: {
  slug: string;
  title: string;
  summary: string;
  toolCount: number;
  smokeTestedCount: number;
  score: number;
}): RankedUseCase {
  return {
    slug: useCase.slug,
    title: useCase.title,
    summary: useCase.summary,
    toolCount: useCase.toolCount,
    smokeTestedCount: useCase.smokeTestedCount,
    score: useCase.score,
  };
}

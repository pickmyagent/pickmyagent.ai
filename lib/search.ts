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

/** Leading verbs that should gerund in a header, without counting as extra search intent. */
const LEADING_GERUNDS: Record<string, string> = {
  rebalance: "rebalancing",
  update: "updating",
  sort: "sorting",
  review: "reviewing",
  crawl: "crawling",
  split: "splitting",
  reset: "resetting",
  tutor: "tutoring",
  research: "researching",
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
  "thread", "threads",
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

const PHRASE_NOISE = new Set([
  "use", "using", "used", "best", "there", "can", "could", "ai", "tool", "tools",
  "something", "someone", "just", "really", "please", "looking", "get",
]);

const PROPER_NOUNS = new Set([
  "south", "carolina", "california", "texas", "florida", "york", "lisbon", "london",
  "seo", "api", "crm", "gpt", "irs", "npc", "npcs", "pdf",
]);

/** Drop "use an agent for", "is there an AI that can", and the other tool-seeking openers. */
export function stripWrappers(input: string): string {
  let text = input.trim().replace(/\s+/g, " ").replace(/^[^A-Za-z0-9]+/, "").replace(/[.?!…]+$/g, "");
  const patterns = [
    /^(?:hey|hi|hello|ok|okay|so)\s+/i,
    /^please\s+/i,
    /^(?:i\s+was\s+wondering\s+if|i(?:'ve|\s+have)\s+been\s+trying\s+to(?:\s+figure\s+out)?)\s+/i,
    /^(?:can|could)\s+you\s+(?:please\s+)?/i,
    /^how\s+(?:do|can|should|could)\s+i\s+(?:use\s+(?:an?\s+)?(?:ai|agent|tool)s?\s+to\s+)?/i,
    /^(?:what|which)\s+(?:kind\s+of\s+)?(?:ai|agents?|tools?)\s+(?:can|will|should|could)\s+/i,
    /^which\s+(?:ai\s+)?tools?\s+(?:can|should|will|ranks?)\s+/i,
    /^is\s+there\s+an?\s+(?:ai|agent|tool)s?\s+that\s+(?:can|will)\s+/i,
    /^there\s+is\s+an?\s+(?:ai|agent|tool)s?\s+that\s+(?:can|will)\s+/i,
    /^is\s+there\s+an?\s+(?:ai|agent|tool)s?\s+(?:to|for)\s+/i,
    /^(?:i\s+)?just\s+need\s+something\s+that\s+(?:can|will)\s+(?:help\s+me\s+)?/i,
    /^(?:i\s+)?(?:want|need)\s+(?:an?\s+)?ai\s+(?:that\s+(?:can|will)\s+|to\s+)/i,
    /^(?:i\s+)?(?:want|need)\s+(?:to\s+)?(?:find\s+)?(?:me\s+)?(?:an?\s+)?(?:ai\s+)?(?:agents?|tools?)\s+(?:that\s+(?:will|can)\s+|to\s+(?:help\s+me\s+)?|for\s+)?/i,
    /^(?:i\s+)?(?:want|need)\s+(?:to\s+)?(?:help\s+)?(?:with\s+)?/i,
    /^(?:find|get|looking\s+for)\s+(?:me\s+)?(?:an?\s+)?(?:ai\s+)?(?:agents?|tools?)\s+(?:that\s+(?:will|can)\s+|to\s+(?:help\s+me\s+)?|for\s+)?/i,
    /^use\s+(?:an?\s+)?(?:ai\s+)?(?:(?:agents?|tools?)\s+)?(?:for|to)\s+/i,
    /^best\s+(?:ai\s+)?(?:agents?|tools?)\s+(?:for|to)\s+/i,
    /^best\s+ai\s+for\s+/i,
    /^(?:an?\s+)?(?:ai|agents?|tools?)\s+(?:for|to)\s+/i,
    /^(?:an?\s+)?(?:ai\s+)?(?:agents?|tools?)\s+(?:that\s+(?:will|can)\s+|to\s+help\s+me\s+)/i,
    /^help\s+me\s+(?:to\s+|with\s+)?/i,
    /^agents?\s+to\s+help\s+me\s+/i,
    /^help\s+/i,
    /^(?:to|for|with)\s+(?!sale\b)/i,
  ];
  let previous = "";
  while (text && text !== previous) {
    previous = text;
    for (const pattern of patterns) text = text.replace(pattern, "");
    text = text.replace(/\s+/g, " ").trim();
  }
  return text;
}

function applyHeaderGerunds(text: string): string {
  const headerGerunds = { ...GERUNDS, ...HEADER_ONLY_GERUNDS, ...LEADING_GERUNDS };
  return text.replace(/(^|,\s*(?:and\s+)?|\band\s+)([A-Za-z]+)\b/g, (full, prefix: string, word: string) => {
    const gerund = headerGerunds[word.toLowerCase()];
    return gerund ? `${prefix}${gerund}` : full;
  });
}

function lowercasePhrase(phrase: string, original: string): string {
  const shouted = original === original.toUpperCase() && /[A-Z]/.test(original);
  const proper = new Set(PROPER_NOUNS);
  if (!shouted) {
    for (const word of original.match(/[A-Za-z][A-Za-z'-]*/g) ?? []) {
      const bare = word.toLowerCase();
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word.slice(1) !== word.slice(1).toUpperCase()) {
        proper.add(bare);
      }
    }
  }
  return phrase.split(/\s+/).map((word) => {
    const bare = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (proper.has(bare) || PROPER_NOUNS.has(bare)) {
      if (["seo", "api", "crm", "gpt", "irs", "npc", "npcs", "pdf", "ai"].includes(bare)) return bare.toUpperCase();
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(" ");
}

function startsWithVerb(text: string): boolean {
  const first = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  return ACTION_VERBS.includes(first) || first in HEADER_ONLY_GERUNDS || first in INFINITIVES;
}

function nounPhraseWithVerb(remainder: string, useCase?: UseCase | null): string {
  const rest = remainder.replace(/^(?:a|an|the)\s+/i, "").trim();
  const job = useCase?.jobPhrase?.trim();
  if (job) {
    const restWords = new Set(words(rest));
    const overlap = words(job).filter((word) => restWords.has(word) && word.length > 2);
    if (overlap.length > 0 || restWords.size === 0) {
      if (/\byour\b/i.test(rest)) {
        return job.replace(/\b(?:a|an|the)\b/gi, "your").replace(/\byour\s+your\b/gi, "your");
      }
      return job;
    }
    const gerund = job.split(/\s+/)[0] ?? "";
    if (/ing$/i.test(gerund) && rest) {
      const object = /^(?:a|an|the|your)\b/i.test(rest) ? rest : `your ${rest}`;
      return `${gerund} ${object}`;
    }
    if (job) return job;
  }
  if (!rest) return "working on this";
  if (/^working\s+on\b/i.test(rest)) return rest;
  if (/^work\s+on\b/i.test(rest)) return rest.replace(/^work\s+on\b/i, "working on");
  return `working on ${rest}`;
}

export function jobPhrase(query: string, useCase?: UseCase | null): string {
  const stripped = stripWrappers(query).replace(/\bmy\b/gi, "your");
  const gerunded = applyHeaderGerunds(stripped).replace(/\s+/g, " ").trim();
  const phrase = startsWithVerb(stripped) || startsWithVerb(gerunded) ? gerunded : nounPhraseWithVerb(gerunded, useCase);
  return lowercasePhrase(phrase, query).replace(/\s+/g, " ").trim() || "working on this";
}

export function cleanUserPhrase(query: string): string {
  return jobPhrase(query);
}

function extractPlace(query: string): string | null {
  const match = query.match(/\bin\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s*$/);
  if (!match) return null;
  const raw = match[1].trim();
  if (/^(the|a|my|your|order|general|mind)$/i.test(raw)) return null;
  return raw.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function jobLead(query: string, useCase?: UseCase | null): string {
  return `For ${jobPhrase(query, useCase)}, here's how each tool can help:`;
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

export function templatedIntro(query: string, useCase?: UseCase | null): string {
  const verbs = extractVerbs(query);
  const specific = verbs.filter((verb) => !GENERIC.has(verb));
  if (specific.length === 0) {
    return `AI agents can help with ${jobPhrase(query, useCase)} by researching, comparing, and summarizing.`;
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
  return queryTokens(query).some((token) =>
    !allowed.has(token) && !placeWords.has(token) && !PHRASE_NOISE.has(token),
  );
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
  return templatedIntro(query, useCase);
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
  const sentences = line
    .replace(/\bdocs checked\b[^.]*\.?/gi, "")
    .replace(/\bwe did not sign up\b\.?/gi, "")
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) =>
      sentence.trim().length > 0 &&
      !/\$|\bper\s+(?:month|mo|seat|user|year)\b|\bbilled\b|\bwhen no specialist\b/i.test(sentence),
    );
  const clauses = sentences.join(" ").split(/,\s*/);
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
INFINITIVES.working = "work";
for (const [verb, gerund] of Object.entries(LEADING_GERUNDS)) INFINITIVES[gerund] = verb;

function toInfinitive(text: string): string {
  const converted = text.replace(/(^|,\s*(?:and\s+)?|\band\s+)([A-Za-z]+)\b/g, (full, prefix: string, word: string) => {
    const infinitive = INFINITIVES[word.toLowerCase()];
    return infinitive ? `${prefix}${infinitive}` : full;
  });
  return converted.replace(/^([A-Za-z]{3,})ing\b/i, (full, stem: string) =>
    INFINITIVES[full.toLowerCase()] ? full : stem.toLowerCase(),
  );
}

/** Strip "find an agent that will" and similar wrappers. Leave the job underneath. */
function unwrapJob(query: string): string {
  const text = stripWrappers(query).replace(/\bmy\b/gi, "your").replace(/^(?:to|for|with)\s+/i, "");
  return toInfinitive(text).replace(/\s+/g, " ").trim();
}

function displayWord(raw: string, query: string): string {
  const bare = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!bare) return "";
  if (bare === "your") return "your";
  const shouted = query === query.toUpperCase() && /[A-Z]/.test(query);
  if (!shouted) {
    for (const word of query.match(/[A-Za-z][A-Za-z'-]*/g) ?? []) {
      if (word.toLowerCase() !== bare || word.length < 2) continue;
      if (word[0] === word[0].toUpperCase() && word.slice(1) !== word.slice(1).toUpperCase()) {
        return word[0].toUpperCase() + bare.slice(1);
      }
    }
  }
  if (PROPER_NOUNS.has(bare)) return bare[0].toUpperCase() + bare.slice(1);
  return bare;
}

function shortObject(text: string, verbs: string[], query: string): string {
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
    const shown = displayWord(raw, query);
    if (!shown) continue;
    kept.push(shown);
    if (bare !== "your") content += 1;
    if (content >= 4) break;
  }
  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function infinitiveJob(query: string, useCase?: UseCase | null): string {
  const phrase = toInfinitive(jobPhrase(query, useCase));
  return tidyPhrase(phrase) || "work through this";
}

function jobEndings(query: string, useCase?: UseCase | null): string[] {
  if (/\btaxes?\b/i.test(query)) {
    return ["file your taxes", "get your taxes done", "finish your taxes", "complete your taxes"];
  }
  const base = infinitiveJob(query, useCase).replace(/\bfind an agent\b/gi, "").replace(/\s+/g, " ").trim();
  const gerund = jobPhrase(query, useCase);
  const endings = [base];
  const withoutFind = base.replace(/^find and\s+/i, "");
  if (withoutFind && withoutFind !== base) endings.push(withoutFind);
  const swapped = base.match(/^(\w+) and (\w+) (.+)$/);
  if (swapped) endings.push(`${swapped[1]} ${swapped[3]} and ${swapped[2]} them`);
  if (/^manage\b/i.test(base)) endings.push(base.replace(/^manage\b/i, "clear"));
  if (base && !/\byourself\b/i.test(base)) endings.push(`${base} yourself`);
  if (gerund && gerund !== base) {
    endings.push(`start ${gerund}`, `keep ${gerund}`, `finish ${gerund}`);
  }
  return [...new Set(endings.map((item) => tidyPhrase(item)).filter(Boolean))];
}

function lowerFirst(text: string): string {
  const match = /^([A-Za-z]+)([\s\S]*)$/.exec(text);
  if (!match) return text;
  const word = match[1];
  if (word.length > 1 && word.length <= 5 && word === word.toUpperCase()) return text;
  return word.charAt(0).toLowerCase() + word.slice(1) + match[2];
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
  const object = shortObject(unwrapped, extractVerbs(unwrapped), query);
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
  const words = shortObject(unwrapped, extractVerbs(unwrapped), query)
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
  let capability = lowerFirst(bestCapability(tool, useCase?.slug ?? null, query) || "helps with this job");
  const nameTail = tool.name.split(/\s+/).at(-1)?.replace(/[^A-Za-z0-9]/g, "").toLowerCase() ?? "";
  const capabilityHead = capability.split(/\s+/)[0]?.replace(/[^A-Za-z0-9]/g, "").toLowerCase() ?? "";
  if (nameTail && capabilityHead === nameTail) {
    capability = lowerFirst(capability.split(/\s+/).slice(1).join(" ") || "helps with this job");
  } else if (capability.toLowerCase().startsWith(`${tool.name.toLowerCase()} `)) {
    capability = lowerFirst(capability.slice(tool.name.length).trim());
  }
  const first = capability.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "").toLowerCase() ?? "";
  const gerundStart = Boolean(INFINITIVES[first] || (first.length >= 5 && first.endsWith("ing")));
  const nounStart = first === "a" || first === "an" || first === "the" || first === "your";
  const clause = gerundStart || nounStart ? `${tool.name} is for ${capability}` : `${tool.name} ${capability}`;
  const endings = jobEndings(query, useCase);
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
        whyItHelps(tool.source, primaryCase?.source ?? null, corrected, Boolean(tool.source.generalPurpose), index),
        Boolean(tool.source.generalPurpose),
      ),
    ),
    useCases: primaryCase ? [presentCase(primaryCase)] : [],
    fallback: lowMatch,
    lowMatch,
    lead: jobLead(corrected, primaryCase?.source ?? null),
    intro: jobIntro(corrected, primaryCase?.source, winner?.concept ?? null),
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

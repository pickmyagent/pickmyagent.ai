import { domainAssistantLine, openAssistantLine } from "./assistant-lines.ts";
import { BRIDGE_LINES, isListingPhotoQuery, listingSpecialistLine, specialistLine } from "./specialist-lines.ts";
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
  fix: "fixing",
  paint: "painting",
  learn: "learning",
  pack: "packing",
  name: "naming",
  water: "watering",
  fold: "folding",
  start: "starting",
  triage: "triaging",
  fill: "filling",
  file: "filing",
  transcribe: "transcribing",
  send: "sending",
  post: "posting",
  take: "taking",
  bill: "billing",
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

const SPELLING: Record<string, string> = {
  custmer: "customer",
  litrature: "literature",
  emial: "email",
  portfolo: "portfolio",
  investmnt: "investment",
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
  const spelled = SPELLING[token];
  if (spelled) return spelled;
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
  if (concept.id === "real-estate" && !bareRealEstateQuery(lower)) return 0;
  if (concept.id === "resume" && hiringResumeQuery(lower)) return 0;
  if (concept.id === "video" && (videoGenerationQuery(lower) || listingVideoQuery(lower) || avatarQuery(lower))) return 0;
  if ((concept.id === "voice" || concept.id === "image" || concept.id === "three-d") && videoGenerationQuery(lower)) return 0;
  if (concept.id === "image" && threeDQuery(lower)) return 0;
  if (concept.id === "three-d" && !threeDQuery(lower)) return 0;
  if (concept.id === "video-generation" && (listingVideoQuery(lower) || avatarQuery(lower))) return 0;
  if (concept.id === "avatar" && (videoGenerationQuery(lower) || listingVideoQuery(lower))) return 0;
  if (concept.id === "listing-video" && avatarQuery(lower)) return 0;
  if (concept.id === "tutoring" && languageQuery(lower)) return 0;
  let score = 0;
  if (concept.id === "video-generation" && videoGenerationQuery(lower)) score += 12;
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
  "seo", "api", "crm", "gpt", "irs", "npc", "npcs", "pdf", "ai", "fsbo", "rag", "soc",
  "gmail", "youtube", "instagram", "spanish", "french", "german", "japanese",
]);

const ACRONYM_CASE: Record<string, string> = {
  seo: "SEO",
  api: "API",
  crm: "CRM",
  gpt: "GPT",
  irs: "IRS",
  npc: "NPC",
  npcs: "NPCs",
  pdf: "PDF",
  ai: "AI",
  fsbo: "FSBO",
  rag: "RAG",
  soc: "SOC",
  gmail: "Gmail",
  youtube: "YouTube",
  instagram: "Instagram",
  spanish: "Spanish",
  french: "French",
  german: "German",
  japanese: "Japanese",
  twitch: "Twitch",
  deepseek: "DeepSeek",
  "3d": "3D",
  k5: "K-5",
};

/** Drop "use an agent for", "is there an AI that can", and the other tool-seeking openers. */
export function stripWrappers(input: string): string {
  let text = input.trim().replace(/\s+/g, " ").replace(/^[^A-Za-z0-9]+/, "").replace(/[.?!…]+$/g, "").replace(/\s+please$/i, "");
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
    /^who\s+can\s+/i,
    /^help\s+(?!center\b|desk\b)/i,
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
  return text.replace(/(^|,\s*(?:and\s+)?|\band\s+(?:also\s+)?)([A-Za-z]+)\b/g, (full, prefix: string, word: string) => {
    const gerund = headerGerunds[word.toLowerCase()];
    return gerund ? `${prefix}${gerund}` : full;
  });
}

function lowercasePhrase(phrase: string, original: string): string {
  const shouted = original === original.toUpperCase() && /[A-Z]/.test(original);
  const proper = new Set(PROPER_NOUNS);
  if (!shouted) {
    const originalWords = original.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    originalWords.forEach((word, index) => {
      if (index === 0) return;
      const bare = word.toLowerCase();
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word.slice(1) !== word.slice(1).toUpperCase()) {
        proper.add(bare);
      }
    });
  }
  return phrase.split(/\s+/).map((word) => {
    const bare = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (word === "IT") return "IT";
    if (/^q&a$/i.test(word)) return "Q&A";
    if (ACRONYM_CASE[bare]) return ACRONYM_CASE[bare];
    if (proper.has(bare) || PROPER_NOUNS.has(bare)) {
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.toLowerCase();
  }).join(" ");
}

const CANONICAL_JOB: Record<string, string> = {
  "find-off-market": "finding off-market and for-sale-by-owner deals",
  "find-land": "finding potentially viable land deals",
  "rank-property-deals": "finding and ranking real estate deals",
  "manage-portfolio": "managing an investment portfolio",
  "do-taxes": "doing your taxes",
  "customer-support": "handling customer support tickets",
  "sales-outreach": "qualifying leads and sending sales outreach",
  "manage-inbox": "managing an email inbox",
  "scheduling-assistant": "scheduling and admin",
  "create-content": "creating and optimizing content",
  "marketing-promotions": "automating marketing promotions",
  "analyze-data": "analyzing data and generating reports",
  "hire-candidates": "screening and sourcing candidates",
  "plan-travel": "planning and booking travel",
  "shop-products": "shopping and comparing products",
  "finance-ops": "processing invoices and finance ops",
  "knowledge-qa": "answering questions from your company wiki",
  "social-media": "managing social media",
  "it-helpdesk": "handling IT help desk requests",
  "security-ops": "monitoring security threats",
  "deep-research": "doing deep research",
  tutoring: "getting tutoring help",
  "game-creative": "turning a long video into short clips",
  "video-generation": "making a cinematic video",
  "voice-audio": "generating a voice track",
  "make-images": "making an image",
  "make-3d": "making a 3D model",
  "avatar-video": "making an avatar video",
  "listing-videos": "making a real estate listing video",
  "real-estate": "finding AI tools for real estate",
  "write-resume": "writing a resume",
  "coding-agents": "writing and reviewing code",
  "workflow-automation": "automating repeated tasks",
  "multi-agent-workflows": "splitting one job across several agents",
  "research-rag": "building a RAG pipeline",
  "meetings-knowledge": "turning a meeting into notes and tasks",
  "tool-use-browser": "automating steps in a web browser",
  "game-npcs": "adding an in-game character that can talk",
};

/** Noun phrases that should use the use-case line instead of "help with". */
const CATEGORY_PHRASES = new Set([
  "motivated sellers",
  "workflow automation",
  "calendar management",
  "resume review",
  "support tickets",
  "customer support",
  "price comparison",
  "product recommendations",
  "accounts payable",
  "knowledge base",
  "enterprise search",
  "policy lookup",
  "document q&a",
  "phishing report",
  "threat hunting",
  "computer use",
  "multi-agent crew",
  "agent crew",
  "multi-agent workflow",
  "vector database",
  "email inbox",
  "investment portfolio",
  "stock portfolio",
  "help center for order status",
  "personalized learning",
  "off-market deals",
  "finance ops",
  "social media",
  "deep research",
  "literature review",
  "market research",
  "competitive analysis",
  "meeting notes",
  "browser agent",
  "help desk ticket",
  "game npcs",
]);

const PHRASE_HEADER: Record<string, string> = {
  "motivated sellers": "finding motivated sellers",
  "real estate": "finding AI tools for real estate",
  "resume review": "reviewing a resume",
  "concept art": "making concept art",
  "realtor video editing": "editing a realtor video",
  "k-5 math tutor": "finding a K-5 math tutor",
  "math for kids": "finding math help for kids",
  "3rd grade math": "tutoring 3rd grade math",
  "resume review for this applicant": "reviewing this applicant's resume",
  "video of me talking without filming": "making a video of you talking without filming",
  "talking head video": "making a talking-head video",
  "spokesperson video": "making a spokesperson video",
  "ai avatar video": "making an AI avatar video",
  "property walkthrough video": "making a property walkthrough video",
  "language practice": "practicing a language",
};

const NO_ARTICLE = new Set([
  "real", "acreage", "zoning", "meal", "homework", "research", "hiring", "fsbo", "marketing",
  "npc", "npcs", "rag", "soc", "crm", "gmail", "youtube",
]);

function tokenAt(text: string, index: number): string {
  return text.split(/\s+/)[index]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
}

function startsWithTaskVerb(text: string): boolean {
  const first = tokenAt(text, 0);
  const second = tokenAt(text, 1);
  if (!first) return false;
  if (first === "support" && /^(?:tickets?|desk|center)$/.test(second)) return false;
  if (first === "help" && /^(?:center|desk)$/.test(second)) return false;
  if (ACTION_VERBS.includes(first) || first in HEADER_ONLY_GERUNDS || first in LEADING_GERUNDS) return true;
  const knownGerunds = new Set(Object.values({ ...GERUNDS, ...HEADER_ONLY_GERUNDS, ...LEADING_GERUNDS }));
  return knownGerunds.has(first);
}

function contentWords(text: string): string[] {
  return words(text).filter((word) => !STOPWORDS.has(word) && !PHRASE_NOISE.has(word) && word.length > 2);
}

function categoryKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/^(?:a|an|the|your)\s+/i, "")
    .replace(/^something\s+for\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function personalize(canonical: string, wantsYour: boolean): string {
  if (!wantsYour) return canonical;
  return canonical.replace(/\b(?:a|an)\b/gi, "your");
}

function canonicalHeader(useCase: UseCase | null | undefined, key: string, wantsYour: boolean): string | null {
  if (PHRASE_HEADER[key]) return PHRASE_HEADER[key];
  const canonical = useCase ? CANONICAL_JOB[useCase.slug] : "";
  if (!canonical) return null;
  return personalize(canonical, wantsYour);
}

function lightArticle(phrase: string): string {
  if (/^(?:a|an|the|your)\b/i.test(phrase)) return phrase;
  const parts = phrase.split(/\s+/);
  const first = parts[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if ((first === "youtube" || first === "soc") && parts.length > 1) return `a ${phrase}`;
  if (!first || NO_ARTICLE.has(first)) return phrase;
  if (first === "seo") return `an ${phrase}`;
  if (/(?:s|es)$/i.test(first) && !/(?:ss|is|us)$/i.test(first)) return phrase;
  const head = phrase.split(/\s+\b(?:in|for|on|with|from|near|by|to)\b\s+/i)[0] ?? phrase;
  if (head.split(/\s+/).some((part) => {
    const bare = part.toLowerCase().replace(/[^a-z]/g, "");
    return /(?:s|es)$/i.test(bare) && !/(?:ss|is|us)$/i.test(bare);
  })) return phrase;
  return `${/^[aeiou]/i.test(first) ? "an" : "a"} ${phrase}`;
}

function bareGerundPhrase(phrase: string): boolean {
  return /^[a-z]+ing(?:\s+(?:me|you|us|them))?$/i.test(phrase.trim());
}

function chooseHeader(cleaned: string, useCase: UseCase | null | undefined, wantsYour: boolean): string {
  if (!cleaned) return useCase ? personalize(CANONICAL_JOB[useCase.slug] ?? "help with this", wantsYour) : "help with this";
  if (/^(?:tutor(?:ing)?(?:\s+me)?)$/i.test(cleaned)) return "getting tutoring help";
  if (/\bimage[\s-]to[\s-]video\b/i.test(cleaned)) return "making a video from an image";
  if (/\btext[\s-]to[\s-]video\b/i.test(cleaned)) return "making a video from text";
  if (/\btext[\s-]to[\s-]speech\b/i.test(cleaned)) return "making speech from text";
  if (/\btext[\s-]to[\s-]image\b/i.test(cleaned)) return "making an image from text";
  if (/^skip\s+trace\b/i.test(cleaned)) {
    return `skip-tracing ${cleaned.replace(/^skip\s+trace\s+/i, "")}`.replace(/\s+/g, " ").trim();
  }
  if (startsWithTaskVerb(cleaned)) {
    const gerunded = applyHeaderGerunds(cleaned).replace(/\s+/g, " ").trim();
    const key = categoryKey(gerunded);
    const thin = bareGerundPhrase(gerunded) || /^[a-z]+ing\s+(?:from|about)\b/i.test(gerunded);
    if (thin && useCase) return canonicalHeader(useCase, key, wantsYour) ?? gerunded;
    return gerunded;
  }
  if (videoGenerationQuery(cleaned) && /\bwith\b/i.test(cleaned)) {
    return `making ${lightArticle(cleaned)}`;
  }
  const key = categoryKey(cleaned);
  const short = contentWords(key).length <= 1;
  if (useCase && (short || CATEGORY_PHRASES.has(key) || PHRASE_HEADER[key])) {
    return canonicalHeader(useCase, key, wantsYour) ?? `help with ${lightArticle(cleaned)}`;
  }
  return `help with ${lightArticle(cleaned)}`;
}

export function jobPhrase(query: string, useCase?: UseCase | null): string {
  const wantsYour = /\b(?:my|our)\b/i.test(query);
  const cleaned = stripWrappers(query)
    .replace(/\b(?:my|our)\b/gi, "your")
    .replace(/,\s+i\b[\s\S]*$/i, "")
    .replace(/\s+and\s+i\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const phrase = chooseHeader(cleaned, useCase, wantsYour);
  return lowercasePhrase(phrase, query)
    .replace(/,\s+and\b/gi, " and")
    .replace(/\band also\b/gi, "and")
    .replace(/\bto social\b(?!\s+media)/gi, "to social media")
    .replace(/\bemail them\b/gi, "emailing them")
    .replace(/\s+/g, " ")
    .trim() || "help with this";
}

export function cleanUserPhrase(query: string): string {
  return jobPhrase(query);
}

export function jobLead(query: string, useCase?: UseCase | null): string {
  return `For ${jobPhrase(query, useCase)}, here's how each tool can help:`;
}

function introVerbs(query: string): string[] {
  const cleaned = stripWrappers(query);
  const header = { ...GERUNDS, ...HEADER_ONLY_GERUNDS, ...LEADING_GERUNDS };
  const parts = cleaned.split(/\s+/);
  const found: string[] = [];
  const take = (word: string) => {
    const bare = word.toLowerCase().replace(/[^a-z]/g, "");
    if (header[bare] && !found.includes(bare)) found.push(bare);
  };
  if (startsWithTaskVerb(cleaned)) take(parts[0] ?? "");
  for (let index = 0; index < parts.length - 1; index++) {
    if (!/^and$/i.test(parts[index].replace(/[^a-z]/gi, ""))) continue;
    const next = parts[index + 1] ?? "";
    if (/^also$/i.test(next.replace(/[^a-z]/gi, ""))) take(parts[index + 2] ?? "");
    else take(next);
  }
  return found.slice(0, 4);
}

function bareToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const VIDEO_GENERATION_INTRO =
  "AI agents can outline a cinematic shot, name the camera move, and draft the prompt so you generate the clip in a video app and check it yourself.";

const MODEL_CHOICE_INTRO =
  "AI agents can compare coding models by what the docs say each one does, so you pick one and still review the code it writes.";

const PHYSICAL_VERBS = new Set(["fold", "water", "paint", "pack", "fix", "train", "bake", "cook", "clean", "wash", "mow", "repair", "organize"]);
const WRITING_VERBS = new Set(["write", "draft", "edit"]);
const PLANNING_VERBS = new Set(["plan", "schedule", "book"]);
const LEARNING_VERBS = new Set(["learn", "study", "tutor", "practice"]);

function bareRealEstateQuery(query: string): boolean {
  const cleaned = stripWrappers(query).toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned === "real estate";
}

function hiringResumeQuery(query: string): boolean {
  return /\b(candidates?|applicants?|hiring|recruit(?:ing|er)?s?|screen(?:ing)?)\b/i.test(query);
}

function threeDQuery(query: string): boolean {
  return /\b3d\b/i.test(query) || /\bthree[-\s]?d\b/i.test(query);
}

function avatarQuery(query: string): boolean {
  return /\b(avatar|avatars|talking[-\s]?head|spokesperson|without filming)\b/i.test(query);
}

function listingVideoQuery(query: string): boolean {
  if (/\b(listing videos?|video tour|property walkthrough|realtor video|listing photos)\b/i.test(query)) return true;
  return /\b(realtor|listing)\b/i.test(query) && /\b(video|videos|tour|walkthrough)\b/i.test(query);
}

function languageQuery(query: string): boolean {
  return /\b(duolingo|spanish|french|german|japanese|languages?)\b/i.test(query);
}

const LISTING_EDITOR_ORDER = ["capcut", "kapwing", "descript", "canva"];
const LISTING_PHOTO_ORDER = ["autoreel", "canva", "kapwing", "capcut"];

function roleBonus(conceptId: string, slug: string, query: string): number {
  if (conceptId === "listing-video") {
    const order = isListingPhotoQuery(query) ? LISTING_PHOTO_ORDER : LISTING_EDITOR_ORDER;
    const index = order.indexOf(slug);
    return index >= 0 ? 400 - index * 80 : 0;
  }
  if (conceptId === "tutoring" && slug === "synthesis-tutor" && kidsTutorQuery(query)) return 20;
  return 0;
}

function kidsTutorQuery(query: string): boolean {
  if (/\b(kids?|children|child|elementary|kindergarten)\b/i.test(query)) return true;
  if (/\bk[\s-]?5\b/i.test(query)) return true;
  if (/\b(?:grade\s+[1-5]|[1-5](?:st|nd|rd|th)\s+grade|first grade|second grade|third grade|fourth grade|fifth grade)\b/i.test(query)) return true;
  return /\bmath\b/i.test(query) && /\b(kids?|children|child|elementary)\b/i.test(query);
}

function videoGenerationQuery(query: string): boolean {
  if (listingVideoQuery(query) || avatarQuery(query)) return false;
  if (/\b(clip|clips|clipping|sizzle|highlight|highlights|short|shorts|caption|captions|twitch|vod|reel|reels|youtube|tiktok)\b/i.test(query)) {
    return false;
  }
  if (/\b(?:text|image)[\s-]to[\s-]video\b/i.test(query)) return true;
  if (/\bcinematic\b/i.test(query)) return true;
  if (/\bcamera\b/i.test(query) && /\b(?:video|videos|film|movie|movies|shot|shots)\b/i.test(query)) return true;
  return /\b(?:generate|generating|make|making|create|creating)\b/i.test(query)
    && /\b(?:video|videos|film|movie|movies)\b/i.test(query);
}

function modelChoiceQuery(query: string): boolean {
  return /\bdeepseek\b/i.test(query)
    || /\bai model\b/i.test(query)
    || (/\bcheap\b/i.test(query) && /\bcod/i.test(query));
}

function openIntro(query: string, useCase?: UseCase | null): string {
  const topic = jobPhrase(query, useCase).replace(/^help with\s+/i, "");
  if (/\b\w+\s+alternatives?\b/i.test(query)) {
    return "AI assistants can compare other tools for the same job, and you still pick the one to try.";
  }
  if (/\bmeal prep\b/i.test(topic)) {
    return "AI assistants can't cook the week's meals for you, but they can plan the menu, list the ingredients, and write the prep steps.";
  }
  if (/\bgrocery list\b/i.test(topic)) {
    return "AI assistants can group a grocery list and note what you still buy at the store.";
  }
  if (/\b(?:naming a baby|baby names?)\b/i.test(topic)) {
    return "AI assistants can suggest baby names and say what each one means, and you make the choice.";
  }
  if (/\bbook club\b/i.test(topic)) {
    return "AI assistants can suggest the next book, draft discussion questions, and outline how the club meets.";
  }
  if (/\bsmall business\b/i.test(topic)) {
    return "AI assistants can't run a small business for you, but they can draft a customer reply, outline a week of posts, and list the bookkeeping you still check.";
  }
  const verb = introVerbs(query).find((item) => !GENERIC.has(item));
  if (verb && PHYSICAL_VERBS.has(verb)) {
    const act = infinitivePhrase(topic);
    const tail = /\bfor\b/.test(act) ? "" : " for you";
    return `AI assistants can't ${act}${tail}, but they can build a checklist and remind you when each step is due.`;
  }
  if (verb && WRITING_VERBS.has(verb)) {
    return `AI assistants can help with ${topic} by drafting a first version, listing what to change, and leaving the final wording to you.`;
  }
  if (verb && PLANNING_VERBS.has(verb)) {
    return `AI assistants can help with ${topic} by laying out the steps, comparing options, and drafting the messages you still send yourself.`;
  }
  if (verb && LEARNING_VERBS.has(verb)) {
    return `AI assistants can help with ${topic} by explaining the next idea, drafting a little practice, and keeping a list of what you still want to review.`;
  }
  return `AI assistants can help with ${topic} by turning it into a plan, answering questions as you go, and drafting anything you need to write.`;
}

export function templatedIntro(query: string, useCase?: UseCase | null): string {
  return openIntro(query, useCase);
}

const LISTING_EDIT_INTRO =
  "AI agents can trim your walkthrough footage, add room labels and captions, pick music, and resize it into a vertical reel for Instagram or TikTok.";
const LISTING_PHOTO_INTRO =
  "AI agents can turn listing photos into a home tour, add room labels and captions, pick music, and resize it into a vertical reel for Instagram or TikTok.";

export function jobIntro(query: string, useCase: UseCase | undefined, concept: Concept | null): string {
  if (videoGenerationQuery(query)) return VIDEO_GENERATION_INTRO;
  if ((useCase?.slug === "coding-agents" || concept?.id === "code") && modelChoiceQuery(query)) return MODEL_CHOICE_INTRO;
  if (useCase?.slug === "listing-videos" || concept?.id === "listing-video") {
    return isListingPhotoQuery(query) ? LISTING_PHOTO_INTRO : LISTING_EDIT_INTRO;
  }
  if (useCase?.intro) return useCase.intro;
  return openIntro(query, useCase);
}

const INFINITIVES: Record<string, string> = {};
for (const [verb, gerund] of Object.entries({ ...GERUNDS, ...HEADER_ONLY_GERUNDS })) {
  INFINITIVES[gerund] = verb;
}
INFINITIVES.working = "work";
for (const [verb, gerund] of Object.entries(LEADING_GERUNDS)) INFINITIVES[gerund] = verb;

function infinitivePhrase(phrase: string): string {
  return phrase.split(/\s+/).map((token) => {
    const infinitive = INFINITIVES[bareToken(token)];
    return infinitive ? token.replace(/[A-Za-z]+/, infinitive) : token;
  }).join(" ");
}

function assistantSlot(query: string, useCase?: UseCase | null): string {
  const phrase = jobPhrase(query, useCase);
  return phrase.replace(/^help with\s+/i, "").trim() || phrase;
}

function guardSlot(slot: string): string {
  const trimmed = slot.trim();
  const count = trimmed.split(/\s+/).filter(Boolean).length;
  if (!trimmed.includes(",") && count <= 8) return trimmed;
  const first = trimmed.split(/,|\band\b|\bplus\b|&/i)[0]?.trim() ?? trimmed;
  const short = first.split(/\s+/).filter(Boolean).slice(0, 6).join(" ");
  return short || "this job";
}

function assistantWhy(tool: Tool, query: string, useCase: UseCase | null, slotOverride?: string): string {
  const name = tool.assistantName ?? tool.name.split("(")[0].trim();
  if (useCase && !slotOverride) {
    const written = domainAssistantLine(tool.slug, useCase.slug);
    if (written) return written;
  }
  const slot = slotOverride ?? assistantSlot(query, useCase);
  return openAssistantLine(tool.slug, name, guardSlot(slot));
}

function whyItHelps(tool: Tool, useCase: UseCase | null, query: string, general: boolean, index: number): string {
  if (general) return assistantWhy(tool, query, useCase);
  if (useCase?.slug === "listing-videos") {
    const written = listingSpecialistLine(tool.slug, query);
    if (written) return written;
  }
  if (useCase) {
    const written = specialistLine(useCase.slug, tool.slug, index);
    if (written) return written;
  }
  return `${tool.name} helps with this job.`;
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

function alternativeTarget(query: string, tools: IndexedTool[]): IndexedTool | null {
  const cleaned = stripWrappers(query).replace(/[.?!]+$/g, "").trim();
  const match = cleaned.match(/^(?:(?:best|cheap|good|free)\s+)?(?:an?\s+)?(.+?)\s+alternatives?$/i);
  if (!match) return null;
  const subject = match[1]
    .replace(/^(?:a|an|the)\s+/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (subject.length < 2) return null;
  return tools.find((tool) => {
    const name = tool.name.split("(")[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    const slug = tool.slug.replace(/-/g, " ");
    return name === subject || slug === subject;
  }) ?? null;
}

function alternativeLead(tool: IndexedTool): string {
  const name = tool.name.split("(")[0].trim();
  const article = /^[aeiou]/i.test(name) ? "an" : "a";
  return `For finding ${article} ${name} alternative, here's how each tool can help:`;
}

type ConceptHit = { concept: Concept; score: number };

function conceptHits(text: string): ConceptHit[] {
  const lower = text.toLowerCase();
  const tokens = new Set(words(text).map(correctToken));
  return CONCEPTS
    .map((concept) => ({ concept, score: scoreConcept(concept, lower, tokens) }))
    .filter((item) => item.score >= CONCEPT_THRESHOLD)
    .sort((a, b) => b.score - a.score || a.concept.id.localeCompare(b.concept.id));
}

function chooseWinner(hits: ConceptHit[]): ConceptHit | null {
  if (hits.length === 0) return null;
  const workflow = hits.find((item) => item.concept.id === "workflow");
  const rest = hits.filter((item) => item.concept.id !== "workflow");
  const base = workflow && rest.some((item) => item.score >= workflow.score) ? rest : hits;
  const specific = base.filter((item) => !item.concept.broad);
  const pool = specific.length > 0 ? specific : base;
  const top = pool[0];
  if (!top) return null;
  return pool.filter((item) => item.score === top.score).length === 1 ? top : null;
}

/** Tags a concept may surface. Promotions also pulls catalog marketing and social tools. */
export function matchTagsForConcept(concept: Concept, useCases: UseCase[]): string[] {
  if (concept.id === "promotions") return ["marketing-promotions", "create-content", "social-media"];
  const useCase = useCases.find((item) => item.slug === concept.useCase);
  return useCase?.matchTags ?? [concept.useCase];
}

const JOB_SPLIT = /\s*(?:,\s*and\s+|,\s*also\s+|,\s+|\s+&\s+|\s+\bplus\b\s+|\s+\balso\b\s+|\s+\band\b\s+)\s*/i;

function jobParts(query: string): string[] {
  const cleaned = stripWrappers(query).replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return cleaned
    .split(JOB_SPLIT)
    .map((part) => part.replace(/^(?:also|and)\s+/i, "").trim())
    .filter((part) => part.length > 0);
}

type CompoundHit = { part: string; concept: Concept; score: number };

function phraseHit(concept: Concept, text: string): boolean {
  const lower = text.toLowerCase();
  return concept.phrases.some((phrase) => lower.includes(phrase));
}

function absorbed(hit: CompoundHit, hits: CompoundHit[]): boolean {
  if (phraseHit(hit.concept, hit.part)) return false;
  const tokens = new Set(words(hit.part));
  const matched = hit.concept.anchors.filter((anchor) => tokens.has(anchor));
  if (matched.length === 0) return false;
  const others = hits.filter((other) => other.concept.useCase !== hit.concept.useCase);
  return matched.every((anchor) => others.some((other) => other.concept.covered.includes(anchor)));
}

function compoundHits(query: string): CompoundHit[] | null {
  const parts = jobParts(query);
  if (parts.length < 2) return null;
  const hits: CompoundHit[] = [];
  for (const part of parts) {
    const winner = chooseWinner(conceptHits(part));
    if (!winner) continue;
    hits.push({ part, concept: winner.concept, score: winner.score });
  }
  const kept = hits.filter((hit) => !absorbed(hit, hits));
  if (new Set(kept.map((hit) => hit.concept.useCase)).size < 2) return null;
  return kept;
}

const SHORT_LABEL: Record<string, string> = {
  "marketing-promotions": "marketing promotions",
  "finance-ops": "customer invoices",
  "do-taxes": "taxes",
  "scheduling-assistant": "meetings",
  "meetings-knowledge": "meeting notes",
  "create-content": "blog posts",
  "social-media": "social posts",
  "sales-outreach": "sales outreach",
  "customer-support": "support tickets",
  "knowledge-qa": "the knowledge base",
  "listing-videos": "listing videos",
  "manage-inbox": "an inbox",
  "analyze-data": "a spreadsheet",
  "hire-candidates": "hiring",
  "plan-travel": "travel",
  "shop-products": "shopping",
  "coding-agents": "code",
  "workflow-automation": "a workflow",
  "find-off-market": "off-market deals",
  "find-land": "land deals",
  "rank-property-deals": "real estate deals",
  "manage-portfolio": "a portfolio",
  "it-helpdesk": "IT help desk tickets",
  "security-ops": "security alerts",
  "deep-research": "research",
  tutoring: "tutoring",
  "learn-language": "language practice",
  "game-creative": "short clips",
  "video-generation": "a video",
  "voice-audio": "a voice track",
  "make-images": "an image",
  "make-3d": "a 3D model",
  "avatar-video": "an avatar video",
  "write-resume": "a resume",
  "tool-use-browser": "browser steps",
  "research-rag": "a RAG pipeline",
  "multi-agent-workflows": "a multi-agent workflow",
  "game-npcs": "game characters",
  "real-estate": "real estate",
};

const INTRO_CLAUSE: Record<string, string> = {
  "marketing-promotions": "schedule promo emails and posts",
  "finance-ops": "draft and send invoices",
  "do-taxes": "sort records for a tax return",
  "scheduling-assistant": "schedule meetings",
  "meetings-knowledge": "turn the call into notes",
  "create-content": "draft blog posts",
  "social-media": "put posts on a social schedule",
  "sales-outreach": "find leads and email them",
  "customer-support": "answer support tickets",
  "knowledge-qa": "update the knowledge base",
  "listing-videos": "edit a listing video",
  "manage-inbox": "draft the follow-up email",
  "analyze-data": "analyze a spreadsheet",
  "hire-candidates": "screen candidates",
  "plan-travel": "plan the trip",
  "shop-products": "shop for the product",
  "coding-agents": "write the code",
  "workflow-automation": "connect the apps",
  "find-off-market": "find off-market deals",
  "find-land": "look up land",
  "rank-property-deals": "rank the deals",
  "manage-portfolio": "review a portfolio",
  "it-helpdesk": "reset a password",
  "security-ops": "review a security alert",
  "deep-research": "research the question",
  tutoring: "tutor the lesson",
  "learn-language": "practice the language",
  "game-creative": "cut a short clip",
  "video-generation": "plan a cinematic video",
  "voice-audio": "draft a voice track",
  "make-images": "describe an image",
  "make-3d": "describe a 3D model",
  "avatar-video": "draft an avatar script",
  "write-resume": "draft a resume",
  "tool-use-browser": "fill the form",
  "research-rag": "outline a RAG pipeline",
  "multi-agent-workflows": "split the job across agents",
  "game-npcs": "draft character lines",
  "real-estate": "compare a property deal",
};

const PAIR_INTRO: Record<string, string> = {
  "finance-ops+marketing-promotions":
    "AI agents can schedule promo emails and posts, and draft and send invoices on a schedule, often from one workflow that connects your marketing and billing apps.",
};

function joinAnd(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? "";
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")} and ${phrases[phrases.length - 1]}`;
}

function polishPart(phrase: string): string {
  return phrase
    .replace(/\bsending invoices to customers\b/gi, "sending customer invoices")
    .replace(/\binvoices to customers\b/gi, "customer invoices")
    .replace(/\btutoring me in\b/gi, "tutoring")
    .replace(/\bemail them\b/gi, "emailing them")
    .replace(/\band also\b/gi, "and")
    .replace(/\bto social\b(?!\s+media)/gi, "to social media")
    .replace(/,\s+and\b/gi, " and")
    .replace(/\s+/g, " ")
    .trim();
}

function compoundLead(hits: CompoundHit[], useCases: UseCase[]): string {
  const phrases = hits.map((hit) => {
    const useCase = useCases.find((item) => item.slug === hit.concept.useCase) ?? null;
    return polishPart(jobPhrase(hit.part, useCase));
  });
  return `For ${joinAnd(phrases)}, here's how each tool can help:`;
}

function titledLanguage(language: string): string {
  return language[0].toUpperCase() + language.slice(1).toLowerCase();
}

function introClause(hit: CompoundHit): string {
  const part = hit.part.toLowerCase();
  const useCase = hit.concept.useCase;
  if (useCase === "finance-ops") {
    if (/\b(expense|expenses|receipt|receipts|bookkeep)/.test(part)) return "track expenses";
    if (/\bbill/.test(part)) return "bill clients";
    if (/\bprocess/.test(part)) return "process invoices";
  }
  if (useCase === "sales-outreach" && /\bqualif/.test(part)) return "qualify leads";
  if (useCase === "shop-products") {
    const item = part.replace(/^(?:shop|shopping)\s+(?:for\s+)?/i, "").replace(/[.?!]+$/g, "").trim();
    if (item && item.split(/\s+/).length <= 3) return `shop for ${item}`;
  }
  if (useCase === "tutoring") {
    const subject = part.replace(/^tutor(?:ing)?\s+(?:me\s+)?(?:in\s+)?/i, "").trim();
    if (subject && subject !== "me" && subject.split(/\s+/).length <= 3) return `tutor ${subject}`;
  }
  if (useCase === "learn-language") {
    const language = part.match(/\b(spanish|french|german|japanese|english)\b/i)?.[1];
    if (language) return `practice ${titledLanguage(language)}`;
  }
  return INTRO_CLAUSE[useCase] ?? "handle that part";
}

function compoundIntro(hits: CompoundHit[]): string {
  const key = [...new Set(hits.map((hit) => hit.concept.useCase))].sort().join("+");
  if (PAIR_INTRO[key]) return PAIR_INTRO[key];
  const clauses: string[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    if (seen.has(hit.concept.useCase)) continue;
    seen.add(hit.concept.useCase);
    clauses.push(introClause(hit));
  }
  return `AI agents can ${joinAnd(clauses)}.`;
}

function compoundSlot(hits: CompoundHit[]): string {
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const hit of hits) {
    const label = SHORT_LABEL[hit.concept.useCase] ?? "this job";
    if (seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return joinAnd(labels);
}

function lineUseCase(tool: Tool, concept: Concept): string {
  if (concept.id === "promotions") {
    if (tool.useCaseTags.includes("marketing-promotions")) return "marketing-promotions";
    if (tool.useCaseTags.includes("social-media")) return "social-media";
    return "create-content";
  }
  return concept.useCase;
}

const BRIDGE_SLUGS = ["n8n", "make", "zapier"];

function wantsBridge(hits: CompoundHit[]): boolean {
  const ids = new Set(hits.map((hit) => hit.concept.useCase));
  return ids.has("marketing-promotions") && ids.has("finance-ops");
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
  const terms = queryTokens(corrected);
  const queryWantsClips = terms.some((term) => CLIP_TERMS.has(term));
  const assistantOrder = ["claude", "chatgpt", "gemini", "perplexity", "deepseek"];
  const alt = alternativeTarget(corrected, indexedTools);
  const assistants = indexedTools
    .filter((tool) => tool.source.generalPurpose)
    .sort((a, b) => assistantOrder.indexOf(a.slug) - assistantOrder.indexOf(b.slug));

  const collect = (concept: Concept, score: number, text: string, clipAll: boolean): IndexedTool[] => {
    const allowed = new Set(concept.categories);
    const matchTags = matchTagsForConcept(concept, catalog.useCases);
    const partTerms = queryTokens(text);
    const found: IndexedTool[] = [];
    for (const tool of indexedTools) {
      if (tool.source.generalPurpose) continue;
      if (!tool.useCaseTags.some((tag) => matchTags.includes(tag))) continue;
      if (!tool.categories.every((category) => allowed.has(category))) continue;
      if (tool.slug === "synthesis-tutor" && !kidsTutorQuery(corrected)) continue;
      const ownTokens = new Set([...tool.nameTokens, ...tool.tokens]);
      const clipHere = clipAll || concept.id === "video";
      if (queryWantsClips && clipHere && !hitsClipTerms(`${tool.name} ${tool.text}`, ownTokens)) continue;
      if (
        concept.id === "video" &&
        !/\b(video|videos|clip|clips|clipping|youtube|caption|captions|stream|streams|reel|reels|edit|editing)\b/i.test(
          `${tool.name} ${tool.text}`,
        )
      ) {
        continue;
      }
      const overlap = bm25(partTerms.length > 0 ? partTerms : terms, tool.tokens, docTokens);
      const recIndex = indexedCases.find((item) => item.slug === concept.useCase)
        ?.source.recommended.findIndex((item) => item.toolId === tool.source.id) ?? -1;
      const promoBonus = concept.id === "promotions" && tool.useCaseTags.includes("marketing-promotions") ? 12 : 0;
      const recBonus = recIndex >= 0 ? 8 - recIndex : 0;
      found.push({
        ...tool,
        score: score * 10 + overlap + recBonus + promoBonus + roleBonus(concept.id, tool.slug, corrected),
      });
    }
    found.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    return found;
  };

  const compound = compoundHits(corrected);
  if (compound) {
    const seen = new Set<string>();
    const specialists: IndexedTool[] = [];
    const bridgeSlugs = new Set<string>();
    const push = (tool: IndexedTool) => {
      if (seen.has(tool.slug)) return;
      seen.add(tool.slug);
      specialists.push(tool);
    };
    if (wantsBridge(compound)) {
      const lead = indexedTools.find((tool) => tool.slug === BRIDGE_SLUGS[0]);
      if (lead) {
        bridgeSlugs.add(lead.slug);
        push({ ...lead, score: 5000 });
      }
    }
    const groups = compound.map((hit) => collect(hit.concept, hit.score, hit.part, false));
    for (const group of groups) {
      if (group[0]) push(group[0]);
    }
    if (wantsBridge(compound)) {
      for (const slug of BRIDGE_SLUGS.slice(1)) {
        const tool = indexedTools.find((item) => item.slug === slug);
        if (!tool) continue;
        bridgeSlugs.add(slug);
        push({ ...tool, score: 4000 - BRIDGE_SLUGS.indexOf(slug) });
      }
    }
    for (let index = 1; index < 3; index++) {
      for (const group of groups) {
        if (group[index]) push(group[index]);
      }
    }
    const chosen = specialists.slice(0, 7);
    const slot = compoundSlot(compound);
    const cases = compound.flatMap((hit) => {
      const found = indexedCases.find((item) => item.slug === hit.concept.useCase);
      if (!found) return [];
      found.score = Math.max(found.score, hit.score);
      return [found];
    }).filter((item, index, list) => list.findIndex((other) => other.slug === item.slug) === index);
    const whyFor = (tool: IndexedTool, index: number): string => {
      if (tool.source.generalPurpose) return assistantWhy(tool.source, corrected, null, slot);
      if (bridgeSlugs.has(tool.slug) && BRIDGE_LINES[tool.slug]) return BRIDGE_LINES[tool.slug];
      const hit = compound.find((item) => {
        const tags = matchTagsForConcept(item.concept, catalog.useCases);
        return tool.useCaseTags.some((tag) => tags.includes(tag))
          && tool.categories.every((category) => item.concept.categories.includes(category));
      }) ?? compound[0];
      const useCase = catalog.useCases.find((item) => item.slug === lineUseCase(tool.source, hit.concept)) ?? null;
      return whyItHelps(tool.source, useCase, hit.part, false, index);
    };
    const selected = [
      ...chosen,
      ...assistants.filter((tool) => !chosen.some((item) => item.slug === tool.slug)),
    ].filter((tool) => tool.slug !== alt?.slug);
    return {
      tools: selected.map((tool, index) => presentTool(tool, whyFor(tool, index), Boolean(tool.source.generalPurpose))),
      useCases: cases.map(presentCase),
      fallback: false,
      lowMatch: false,
      lead: alt ? alternativeLead(alt) : compoundLead(compound, catalog.useCases),
      intro: compoundIntro(compound),
      disclaimer: cases.map((item) => item.source.disclaimer).find((item) => item) ?? null,
    };
  }

  const winner = chooseWinner(conceptHits(corrected));
  const specialists = winner ? collect(winner.concept, winner.score, corrected, true) : [];
  const primaryCase = winner
    ? indexedCases.find((item) => item.slug === winner.concept.useCase) ?? null
    : null;
  if (primaryCase && winner) primaryCase.score = winner.score;
  const selected = [
    ...specialists.slice(0, 5),
    ...assistants.filter((tool) => !specialists.some((item) => item.slug === tool.slug)),
  ].filter((tool) => tool.slug !== alt?.slug);
  const lowMatch = !winner;

  return {
    tools: selected.map((tool, index) =>
      presentTool(
        tool,
        whyItHelps(
          tool.source,
          tool.source.generalPurpose || !winner
            ? primaryCase?.source ?? null
            : catalog.useCases.find((item) => item.slug === lineUseCase(tool.source, winner.concept)) ?? primaryCase?.source ?? null,
          corrected,
          Boolean(tool.source.generalPurpose),
          index,
        ),
        Boolean(tool.source.generalPurpose),
      ),
    ),
    useCases: primaryCase ? [presentCase(primaryCase)] : [],
    fallback: lowMatch,
    lowMatch,
    lead: alt ? alternativeLead(alt) : jobLead(corrected, primaryCase?.source ?? null),
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

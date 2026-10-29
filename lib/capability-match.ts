import { articleVerbProblems, hasLowercaseI, headerEchoBroken } from "./header-grammar.ts";
import { stemToken } from "./match-text.ts";
import type { Tool } from "./types.ts";

/**
 * Capability match runs only when no predefined job wins.
 * It scores the concrete jobs listed on each tool, then drops any tool
 * whose domain conflicts with the query (a game builder does not answer a land search).
 */

export type CapabilityPick = {
  slug: string;
  capability: string;
  score: number;
  cosine: number;
};

const STOP = new Set([
  "a", "an", "the", "my", "your", "our", "from", "of", "in", "on", "with", "and", "or",
  "to", "for", "into", "that", "this", "it", "is", "are", "be", "do", "me", "i", "we",
  "you", "what", "how", "please", "some", "any", "just", "can", "via", "by", "at", "as",
  "if", "so", "than", "then", "but", "about", "trying", "using", "want", "need", "im",
  "its", "make", "might", "not", "yet", "have", "has", "them", "will", "does", "only",
  "when", "find", "build", "help", "agent", "agents", "tool", "tools", "best", "good",
  "ai", "app", "apps", "software", "online", "platform", "create", "generate", "get",
  "use", "used", "something", "really", "very", "like", "would", "could", "should",
  "been", "was", "were", "they", "their", "there", "here", "also", "too", "more",
  "most", "other", "another", "thing", "things", "stuff", "way", "ways", "able",
  "let", "lets", "new", "one", "two", "per", "out", "up", "down", "over", "after",
  "before", "where", "which", "who", "while", "across", "through", "without",
  "because", "since", "until", "onto", "off", "own", "same", "such", "even", "still",
  "already", "back", "again", "around", "every", "each", "few", "many", "much",
  "both", "between", "under", "above", "next", "last", "first", "well", "better",
  "great", "easy", "simple", "fast", "quick", "free", "paid", "price", "pricing",
  "account", "user", "users", "team", "teams", "work", "working", "job", "jobs",
  "task", "tasks", "feature", "features", "including", "include", "based", "powered",
  "plus", "pro", "please", "help", "looking", "try", "trying", "someone", "anyone",
  "people", "person", "company", "business", "dont", "doesnt", "cant", "wont",
  "gonna", "wanna", "kinda", "sorta", "basically", "actually", "literally",
]);

/** Ordinary words that must not be fuzzy-corrected into a product term. */
const COMMON = new Set([
  "house", "home", "homes", "email", "video", "image", "music", "write", "plant",
  "train", "photo", "photos", "audio", "voice", "model", "code", "data", "file",
  "files", "list", "note", "notes", "post", "posts", "page", "pages", "site",
  "text", "word", "words", "name", "names", "time", "date", "week", "month",
  "year", "money", "cost", "costs", "sale", "sales", "deal", "deals", "lead",
  "leads", "call", "calls", "chat", "mail", "news", "book", "books", "read",
  "open", "save", "send", "share", "start", "stop", "play", "game", "games",
  "song", "songs", "clip", "clips", "room", "rooms", "plan", "plans", "form",
  "forms", "test", "tests", "line", "lines", "link", "links", "view", "show",
  "make", "take", "give", "keep", "move", "turn", "work", "live", "real",
  "full", "high", "long", "short", "small", "large", "local", "legal", "human",
  "paper", "study", "learn", "teach", "class", "group", "order", "store",
  "brand", "logo", "font", "color", "style", "draft", "edit", "copy", "paste",
]);

const CATEGORY_FAMILY: Record<string, string> = {
  "real-estate": "property",
  "creative-media": "creative",
  "game-ai": "games",
  content: "writing",
  "personal-finance": "investing",
  "finance-ops": "books",
  hiring: "hr",
  learning: "education",
  knowledge: "knowledge",
  productivity: "productivity",
  "workflow-automation": "automation",
  "search-rag": "research",
  "agent-frameworks": "agents",
  "coding-agents": "code",
  "tool-use": "browser",
  "data-analysis": "data",
  security: "security",
  "it-support": "it",
  shopping: "shopping",
  travel: "travel",
  "customer-support": "support",
  sales: "sales",
  research: "research",
  "general-assistants": "general",
  writing: "writing",
  image: "image",
  video: "video",
  "audio-voice": "audio",
  music: "music",
  "3d": "3d",
  design: "design",
  architecture: "architecture",
  interior: "interior",
  legal: "legal",
  bookkeeping: "books",
  tax: "tax",
  investing: "investing",
  marketing: "marketing",
  seo: "seo",
  ads: "ads",
  social: "social",
  email: "email",
  hr: "hr",
  education: "education",
  "health-fitness": "fitness",
  meetings: "meetings",
  scheduling: "scheduling",
  spreadsheets: "data",
  "dev-tools": "code",
  "browser-agents": "browser",
  ecommerce: "commerce",
  "small-business": "smb",
  translation: "translation",
  presentations: "slides",
  resumes: "resumes",
  gaming: "games",
  photography: "photo",
  construction: "construction",
  mortgage: "mortgage",
  insurance: "insurance",
  nonprofit: "nonprofit",
};

/** Families that may appear together. A tool outside the expanded set is off-domain. */
const CLUSTER: Record<string, string[]> = {
  property: ["property", "mortgage", "insurance", "construction", "architecture", "interior"],
  mortgage: ["mortgage", "property", "insurance"],
  insurance: ["insurance", "property", "mortgage"],
  construction: ["construction", "architecture", "interior", "property"],
  architecture: ["architecture", "interior", "construction", "image", "3d", "design", "creative", "photo"],
  interior: ["interior", "architecture", "design", "image", "photo", "creative"],
  legal: ["legal"],
  tax: ["tax", "books", "investing"],
  books: ["books", "tax", "smb", "commerce"],
  investing: ["investing", "tax", "data"],
  sales: ["sales", "marketing", "email", "crm"],
  marketing: ["marketing", "seo", "ads", "social", "email", "writing", "commerce"],
  seo: ["seo", "marketing", "writing", "ads"],
  ads: ["ads", "marketing", "social", "image", "video", "creative"],
  social: ["social", "marketing", "video", "ads", "writing"],
  email: ["email", "marketing", "sales", "productivity"],
  support: ["support", "it", "commerce"],
  hr: ["hr", "resumes", "meetings"],
  resumes: ["resumes", "hr", "writing"],
  education: ["education", "research", "writing"],
  fitness: ["fitness"],
  meetings: ["meetings", "productivity", "scheduling", "hr"],
  scheduling: ["scheduling", "meetings", "productivity"],
  productivity: ["productivity", "meetings", "scheduling", "email", "knowledge"],
  research: ["research", "education", "data", "knowledge"],
  data: ["data", "research", "investing"],
  code: ["code", "browser", "agents", "automation", "dev-tools"],
  browser: ["browser", "code", "agents", "automation"],
  agents: ["agents", "code", "browser", "automation"],
  automation: ["automation", "agents", "browser", "code", "smb"],
  security: ["security", "it"],
  it: ["it", "security", "support"],
  commerce: ["commerce", "marketing", "ads", "image", "books"],
  smb: ["smb", "books", "marketing", "automation"],
  translation: ["translation", "writing", "audio"],
  slides: ["slides", "writing", "design"],
  travel: ["travel", "shopping"],
  shopping: ["shopping", "travel", "commerce"],
  games: ["games", "3d", "image", "video", "audio", "creative"],
  music: ["music", "audio"],
  audio: ["audio", "music", "video", "meetings"],
  video: ["video", "audio", "image", "social", "creative", "ads"],
  image: ["image", "design", "photo", "video", "creative", "ads", "architecture"],
  photo: ["photo", "image", "design", "creative"],
  design: ["design", "image", "slides", "creative", "architecture"],
  "3d": ["3d", "games", "image", "design", "architecture", "creative"],
  creative: ["creative", "image", "video", "audio", "design", "3d", "photo"],
  writing: ["writing", "marketing", "seo", "social", "education", "slides", "resumes"],
  knowledge: ["knowledge", "productivity", "research", "support"],
  nonprofit: ["nonprofit", "writing", "marketing"],
  crm: ["sales", "marketing", "email"],
  general: ["general"],
};

const QUERY_CUES: Array<{ family: string; pattern: RegExp }> = [
  { family: "property", pattern: /\b(acreage|acres|parcels?|zoning|zoned|fsbo|off[-\s]?market|realtor|realtors|real estate|listing (?:photo|video|description)|mls\b|cap rate|rental propert|for sale by owner|vacant (?:land|lot)|find land|land (?:for sale|search|parcel)|skip trace|motivated sellers?|comps?\b|cma\b|bpo\b|crexi)\b/i },
  { family: "mortgage", pattern: /\b(mortgages?|pre-?approv|lender|loan estimate|debt[-\s]?to[-\s]?income|refinanc\w*)\b/i },
  { family: "insurance", pattern: /\b(insurance|underwriting|claims? adjust|policy quote|fender|renters insurance)\b/i },
  { family: "construction", pattern: /\b(roofing|drywall|takeoff|jobsite|contractor bid|construction estimate|bill of materials|change order|roof squares|satellite)\b/i },
  { family: "architecture", pattern: /\b(floor ?plans?|blueprints?|elevations?|architect\w*|bim\b|cad drawing|interior render|photoreal)\b/i },
  { family: "interior", pattern: /\b(interior design|virtual staging|room redesign|furnish (?:a|the) room|mood board)\b/i },
  { family: "legal", pattern: /\b(contracts?|redlines?|clauses?|nda\b|lawsuit|deposition|attorney|lawyers?|legal brief|terms of service|demand letter|case law|playbook|due diligence|parking ticket)\b/i },
  { family: "tax", pattern: /\b(tax returns?|1040|deductions?|irs\b|vat return|sales tax|quarterly taxes|w-?2\b|1099)\b/i },
  { family: "books", pattern: /\b(quickbooks|qbo\b|bookkeeping|bookkeep|reconcil\w*|general ledger|accounts payable|accounts receivable|invoices?|receipts?|xero|freshbooks)\b/i },
  { family: "investing", pattern: /\b(portfolios?|brokerage|401k|etfs?|stocks?|tickers?|rebalance)\b/i },
  { family: "sales", pattern: /\b(cold emails?|outbound|sales (?:sequence|pipeline|outreach)|lead lists?|prospects?)\b/i },
  { family: "seo", pattern: /\b(seo\b|backlinks?|keyword research|search ranking|serp\b)\b/i },
  { family: "ads", pattern: /\b(google ads|facebook ads|meta ads|ad creatives?|roas\b|ppc\b)\b/i },
  { family: "social", pattern: /\b(instagram|tiktok|linkedin posts?|social (?:posts?|media|captions?)|youtube shorts)\b/i },
  { family: "email", pattern: /\b(newsletters?|inbox|gmail|email (?:sequence|campaign|drip))\b/i },
  { family: "support", pattern: /\b(support tickets?|help ?desk|refunds?|customer (?:support|service)|chatbot)\b/i },
  { family: "hr", pattern: /\b(candidates?|recruit\w*|job descriptions?|onboarding|payroll|hiring)\b/i },
  { family: "resumes", pattern: /\b(resumes?|cvs?\b|cover letters?)\b/i },
  { family: "education", pattern: /\b(tutors?|tutoring|homework|flashcards?|study (?:plan|guide)|lesson plan)\b/i },
  { family: "fitness", pattern: /\b(workouts?|meal plans?|calories|fitness|meditation|running plan|strength training|half marathon|sleep)\b/i },
  { family: "meetings", pattern: /\b(meeting notes|transcripts?|action items|notetaker|transcribe)\b/i },
  { family: "scheduling", pattern: /\b(calendars?|appointments?|schedule (?:a|my) meeting|time block)\b/i },
  { family: "research", pattern: /\b(literature review|peer-reviewed|citations?|academic papers?|systematic review)\b/i },
  { family: "data", pattern: /\b(spreadsheets?|dashboards?|pivot tables?|csv\b|sql\b|charts?|vlookup|excel|formula)\b/i },
  { family: "code", pattern: /\b(pull requests?|codebase|refactor|github|debug(?:ging)? (?:this|a|the) (?:function|code|bug)|unit tests?|ide\b)\b/i },
  { family: "browser", pattern: /\b(browser agents?|computer use|fill (?:out )?forms?|web scraping agent)\b/i },
  { family: "agents", pattern: /\b(multi-agent|agent crew|agent framework|orchestrat\w* agents)\b/i },
  { family: "automation", pattern: /\b(zapier|workflow automation|automate (?:my|a|the) workflow)\b/i },
  { family: "security", pattern: /\b(phishing|soc alerts?|malware|vulnerabilit\w*|siem\b)\b/i },
  { family: "it", pattern: /\b(password resets?|it tickets?|service desk|mdm\b|vpn\b|help ?desk ticket)\b/i },
  { family: "commerce", pattern: /\b(shopify|ecommerce|e-commerce|product listings?|sku\b|inventory)\b/i },
  { family: "translation", pattern: /\b(translat\w*|dubbing|subtitles?|localization)\b/i },
  { family: "slides", pattern: /\b(slide decks?|powerpoint|pitch decks?|keynote|presentation|google slides)\b/i },
  { family: "travel", pattern: /\b(itinerar\w*|flights?|hotels?|trip plan|lisbon|tokyo|florence|rome)\b/i },
  { family: "games", pattern: /\b(npcs?|game characters?|unity|unreal|twitch|game assets?|vod\b)\b/i },
  { family: "music", pattern: /\b(songs?|beats?|soundtracks?|stem separation|lyrics|lofi|vocal stem)\b/i },
  { family: "audio", pattern: /\b(voice clones?|text to speech|voiceover|podcast (?:edit|intro)|text-to-speech|tts\b)\b/i },
  { family: "video", pattern: /\b(text to video|text-to-video|ai videos?|avatar videos?|caption (?:a|the) video|b-?roll)\b/i },
  { family: "image", pattern: /\b(text to image|text-to-image|remove (?:the )?background|background remov\w*|upscale (?:a |the )?(?:photo|image)|logos?|product photos?)\b/i },
  { family: "design", pattern: /\b(logos?|brand kits?|ui mockups?|figma|wireframes?)\b/i },
  { family: "photo", pattern: /\b(photo retouch|raw photos?|headshots?|portrait edit|wedding photos|cull)\b/i },
  { family: "writing", pattern: /\b(blog posts?|copywriting|grammar|rewrite|essay|newsletter copy)\b/i },
  { family: "nonprofit", pattern: /\b(grant proposals?|donors?|fundraising|nonprofit|food pantry)\b/i },
  { family: "3d", pattern: /\b(3d models?|text to 3d|text-to-3d|mesh(?:es)?)\b/i },
  { family: "shopping", pattern: /\b(price comparison|running shoes|headphones|shop for)\b/i },
];

const EXPANSIONS: Record<string, string[]> = {
  kitchen: ["room", "interior"],
  bedroom: ["room", "interior"],
  bathroom: ["room", "interior"],
  condo: ["room", "interior"],
  staging: ["stage", "photo"],
  mls: ["listing"],
  crexi: ["commercial", "listing"],
  logo: ["brand"],
  captions: ["caption", "subtitle"],
  subtitle: ["caption"],
  workout: ["training", "exercise"],
  meditation: ["mindfulness", "sleep"],
  itinerary: ["trip", "travel"],
  npc: ["character", "game"],
  phishing: ["email", "threat"],
  quickbooks: ["bookkeeping", "reconcile"],
  qbo: ["quickbooks", "bookkeeping"],
};

const SYNONYMS: Record<string, string> = {
  qbo: "quickbooks",
  ig: "instagram",
  fb: "facebook",
  yt: "youtube",
  ppt: "powerpoint",
  pptx: "powerpoint",
  cv: "resume",
  tts: "speech",
  npc: "character",
  npcs: "characters",
  ecommerce: "commerce",
  ecom: "commerce",
  pics: "photos",
  pic: "photo",
  vids: "videos",
  vid: "video",
};

const ACRONYM_CASE: Record<string, string> = {
  seo: "SEO",
  fsbo: "FSBO",
  crm: "CRM",
  npcs: "NPCs",
  npc: "NPC",
  rag: "RAG",
  soc: "SOC",
  gmail: "Gmail",
  cma: "CMA",
  cmas: "CMAs",
  bpo: "BPO",
  bpos: "BPOs",
  mls: "MLS",
  arv: "ARV",
  ai: "AI",
  api: "API",
  sql: "SQL",
  csv: "CSV",
  pdf: "PDF",
  ui: "UI",
  ux: "UX",
  hr: "HR",
  irs: "IRS",
  vat: "VAT",
  roi: "ROI",
  roas: "ROAS",
  ppc: "PPC",
  sku: "SKU",
  nda: "NDA",
  bim: "BIM",
  cad: "CAD",
  tts: "TTS",
  llm: "LLM",
};

const GERUND_FIX: Record<string, string> = {
  be: "being",
  see: "seeing",
  do: "doing",
  go: "going",
  run: "running",
  cut: "cutting",
  put: "putting",
  set: "setting",
  get: "getting",
  plan: "planning",
  stop: "stopping",
  shop: "shopping",
  clip: "clipping",
  edit: "editing",
  write: "writing",
  make: "making",
  take: "taking",
  build: "building",
  send: "sending",
  find: "finding",
};

type CapDoc = {
  slug: string;
  index: number;
  text: string;
  tokens: string[];
  stems: Set<string>;
};

type Cache = {
  tools: Tool[];
  docs: CapDoc[];
  df: Map<string, number>;
  vocab: Map<string, number>;
};

let cache: Cache | null = null;

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function capStem(token: string): string {
  let value = stemToken(token);
  if (value.length > 5 && value.endsWith("ing")) {
    value = value.slice(0, -3);
    const last = value[value.length - 1];
    if (value.length > 3 && last && value.endsWith(last) && !/[aeiou]/.test(last)) value = value.slice(0, -1);
  } else if (value.length > 4 && value.endsWith("ed")) {
    value = value.slice(0, -2);
  }
  if (value.endsWith("e") && value.length > 4) value = value.slice(0, -1);
  return value.length >= 4 ? value : stemToken(token);
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0] ?? 0;
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = row[j] ?? 0;
      const left = row[j - 1] ?? 0;
      row[j] = a[i - 1] === b[j - 1] ? previous : 1 + Math.min(previous, saved, left);
      previous = saved;
    }
  }
  return row[b.length] ?? 2;
}

function contentTokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of words(text)) {
    const mapped = SYNONYMS[raw] ?? raw;
    if (mapped.length < 3 || STOP.has(mapped)) continue;
    out.push(mapped);
  }
  return out;
}

function load(tools: Tool[]): Cache {
  if (cache && cache.tools === tools) return cache;
  const docs: CapDoc[] = [];
  const df = new Map<string, number>();
  const vocab = new Map<string, number>();
  for (const tool of tools) {
    if (tool.generalPurpose || tool.status !== "published") continue;
    const list = tool.capabilities ?? [];
    list.forEach((text, index) => {
      if (text.toLowerCase().startsWith("work from ")) return;
      if (/^use (?!a\b|an\b|the\b)/i.test(text)) return;
      const tokens = contentTokens(text);
      const stems = new Set(tokens.map(capStem));
      docs.push({ slug: tool.slug, index, text, tokens, stems });
      const seen = new Set<string>();
      for (const token of tokens) {
        if (seen.has(token)) continue;
        seen.add(token);
        df.set(token, (df.get(token) ?? 0) + 1);
        vocab.set(token, (vocab.get(token) ?? 0) + 1);
      }
    });
  }
  cache = { tools, docs, df, vocab };
  return cache;
}

function correctToken(token: string, vocab: Map<string, number>): string {
  const mapped = SYNONYMS[token] ?? token;
  if (mapped.length < 5 || COMMON.has(mapped) || vocab.has(mapped) || STOP.has(mapped)) return mapped;
  let best = mapped;
  let bestCount = Infinity;
  for (const [word, count] of vocab) {
    if (Math.abs(word.length - mapped.length) > 1) continue;
    if (word[0] !== mapped[0]) continue;
    if (word.slice(0, 3) !== mapped.slice(0, 3) && Math.abs(word.length - mapped.length) === 0) {
      // a substitution past the third letter is still distance 1; allow it
    }
    if (editDistance(mapped, word) !== 1) continue;
    if (count < bestCount) {
      best = word;
      bestCount = count;
    }
  }
  return best;
}

export function toolFamilies(tool: Tool): Set<string> {
  const families = new Set<string>();
  for (const category of tool.categories) families.add(CATEGORY_FAMILY[category] ?? "other");
  const tags = tool.useCaseTags.join(" ");
  if (/floor-plan|interior/.test(tags)) families.add("architecture");
  if (/listing|cma|realtor|property|off-market|find-land|real-estate/.test(tags)) families.add("property");
  if (/game/.test(tags)) families.add("games");
  if (/voice|audio/.test(tags)) families.add("audio");
  if (/make-3d|\b3d\b/.test(tags)) families.add("3d");
  if (/video|avatar/.test(tags)) families.add("video");
  if (/make-images|image/.test(tags)) families.add("image");
  if (/portfolio|invest/.test(tags)) families.add("investing");
  if (/bookkeep|finance/.test(tags)) families.add("books");
  if (/tax/.test(tags)) families.add("tax");
  if (families.size === 0) families.add("other");
  return families;
}

export function toolFamily(tool: Tool): string {
  return [...toolFamilies(tool)][0] ?? "other";
}

export function queryFamilies(text: string): string[] {
  const found: string[] = [];
  for (const cue of QUERY_CUES) {
    if (cue.pattern.test(text) && !found.includes(cue.family)) found.push(cue.family);
  }
  return found;
}

export function allowedFamilies(families: string[]): Set<string> | null {
  if (families.length === 0) return null;
  const allowed = new Set<string>();
  for (const family of families) {
    allowed.add(family);
    for (const item of CLUSTER[family] ?? []) allowed.add(item);
  }
  return allowed;
}

export function familyAllows(family: string | Set<string>, allowed: Set<string> | null): boolean {
  const families = typeof family === "string" ? [family] : [...family];
  if (!allowed) return families.some((item) => item !== "general");
  return families.some((item) => item !== "general" && allowed.has(item));
}

function toGerund(verb: string): string {
  const lower = verb.toLowerCase();
  if (GERUND_FIX[lower]) return GERUND_FIX[lower];
  if (lower.endsWith("ie")) return `${lower.slice(0, -2)}ying`;
  if (lower.endsWith("e") && !lower.endsWith("ee")) return `${lower.slice(0, -1)}ing`;
  if (/^[a-z]*[aeiou][^aeiou]$/.test(lower) && lower.length <= 4) return `${lower}${lower.slice(-1)}ing`;
  return `${lower}ing`;
}

function caseAcronyms(text: string): string {
  return text.replace(/\b[a-z][a-z0-9&]+\b/g, (word) => ACRONYM_CASE[word] ?? word);
}

export function gerundPhrase(capability: string): string {
  const cleaned = capability.replace(/[.?!]+$/g, "").trim();
  const parts = cleaned.split(/\s+/);
  const first = parts[0]?.toLowerCase() ?? "";
  if (!first) return "help with this task";
  parts[0] = toGerund(first);
  return caseAcronyms(parts.join(" "));
}

export function capabilityLead(capability: string): string {
  const phrase = gerundPhrase(capability);
  const lead = `For ${phrase}, here's how each tool can help:`;
  const body = phrase;
  const words = body.split(/\s+/);
  const stem = (words[0] ?? "").replace(/ing$/, "");
  const twoVerbs = ["test", "fit", "set", "cut", "run"].includes(stem)
    && ["fit", "test", "up", "out"].includes(words[1] ?? "");
  if (
    twoVerbs
    || headerEchoBroken(body)
    || articleVerbProblems(lead).length > 0
    || hasLowercaseI(lead)
    || !/^[a-z]+ing\b/i.test(body)
  ) {
    return "For help with this task, here's how each tool can help:";
  }
  return lead;
}

export function capabilityIntro(capabilities: string[]): string {
  const unique: string[] = [];
  for (const item of capabilities) {
    const text = caseAcronyms(item.replace(/[.?!]+$/g, "").trim());
    if (!text || unique.includes(text)) continue;
    unique.push(text);
    if (unique.length === 2) break;
  }
  const first = unique[0] ?? "handle this job";
  const second = unique[1];
  const intro = second
    ? `AI agents can ${first}, and they can ${second}.`
    : `AI agents can ${first}, and you still decide what happens next.`;
  if (articleVerbProblems(intro).length > 0 || hasLowercaseI(intro)) {
    return "AI agents can help with this task, and you still decide what happens next.";
  }
  return intro;
}

export function capabilityWhy(name: string, capability: string): string {
  const job = caseAcronyms(capability.replace(/[.?!]+$/g, "").trim());
  const line = `${name} can ${job}.`;
  if (articleVerbProblems(line).length > 0 || hasLowercaseI(line)) {
    return `${name} can help with this task.`;
  }
  return line;
}

export function fallbackAssistantWhy(name: string, capability: string, neutral: string): string {
  const phrase = gerundPhrase(capability);
  const line = `Ask ${name} to help with ${phrase}.`;
  if (articleVerbProblems(line).length > 0 || hasLowercaseI(line) || headerEchoBroken(phrase)) return neutral;
  return line;
}

export function capabilityDisclaimer(family: string): string | null {
  if (family === "tax" || family === "books" || family === "investing" || family === "mortgage") {
    return "PickMyAgent is not tax or financial advice.";
  }
  if (family === "fitness") return "PickMyAgent does not provide medical advice.";
  if (family === "legal") return "PickMyAgent is not a law firm.";
  if (family === "insurance") return "PickMyAgent does not sell insurance.";
  return null;
}

function phraseBonus(queryTokens: string[], capability: string): number {
  const hay = ` ${capability.toLowerCase()} `;
  let bonus = 0;
  for (let index = 0; index < queryTokens.length - 1; index += 1) {
    const phrase = `${queryTokens[index]} ${queryTokens[index + 1]}`;
    if (hay.includes(` ${phrase} `) || hay.includes(` ${phrase}`)) bonus += 1;
  }
  return bonus;
}

/**
 * Best capability per tool. Empty when nothing clears the bar.
 * Cosines are optional meaning scores keyed by `${slug}#${capabilityIndex}`.
 */
export function pickCapabilities(
  query: string,
  tools: Tool[],
  cosines?: Map<string, number>,
): CapabilityPick[] {
  const index = load(tools);
  const rawTokens = contentTokens(query);
  const tokens = rawTokens.map((token) => correctToken(token, index.vocab)).filter((token) => !STOP.has(token));
  const original = new Set(tokens);
  for (const token of [...tokens]) {
    for (const extra of EXPANSIONS[token] ?? []) {
      if (!tokens.includes(extra) && !STOP.has(extra)) tokens.push(extra);
    }
  }
  if (tokens.length === 0) return [];
  const stems = tokens.map(capStem);
  const families = queryFamilies(query);
  const allowed = allowedFamilies(families);
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const best = new Map<string, CapabilityPick>();

  for (const doc of index.docs) {
    const tool = bySlug.get(doc.slug);
    if (!tool) continue;
    const family = toolFamilies(tool);
    if (!familyAllows(family, allowed)) continue;
    let overlap = 0;
    const seen = new Set<string>();
    for (let cursor = 0; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor] ?? "";
      const stem = stems[cursor] ?? "";
      if (!token || seen.has(stem)) continue;
      if (!original.has(token) && !allowed) continue;
      if (doc.tokens.includes(token) || doc.stems.has(stem)) {
        seen.add(stem);
        overlap += 1;
      }
    }
    const bonus = phraseBonus(tokens, doc.text);
    const lexical = overlap * 5 + bonus * 4;
    const cosine = cosines?.get(`${doc.slug}#${doc.index}`) ?? 0;
    const lexicalOk = overlap >= 2 || (allowed !== null && overlap >= 1) || (overlap >= 1 && bonus >= 1);
    const semanticOk = Boolean(cosines)
      && familyAllows(family, allowed)
      && overlap >= 1
      && cosine >= 0.7;
    if (!lexicalOk && !semanticOk) continue;
    const fused = cosines
      ? Math.min(lexical, 28) / 28 * 0.45 + cosine * 0.55
      : lexical;
    const current = best.get(doc.slug);
    if (!current || fused > current.score || (fused === current.score && doc.text.length > current.capability.length)) {
      best.set(doc.slug, { slug: doc.slug, capability: doc.text, score: fused, cosine });
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

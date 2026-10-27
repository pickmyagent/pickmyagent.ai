import { CONCEPTS } from "./concepts.ts";
import { SMB_SPELLING } from "./small-business.ts";

/**
 * Query text used for matching. Punctuation, filler, abbreviations, and
 * spelling are normalized here so a paraphrase hits the same concept.
 * Display headers still use the cleaned user phrase.
 */

export const EXTRA_SPELLING: Record<string, string> = {
  comparsons: "comparisons",
  comparsions: "comparisons",
  comparsion: "comparison",
  comparible: "comparable",
  comparibles: "comparables",
  lisitng: "listing",
  listng: "listing",
  listigs: "listings",
  realator: "realtor",
  relator: "realtor",
  realtors: "realtors",
  calender: "calendar",
  schedual: "schedule",
  schedul: "schedule",
  scheduel: "schedule",
  invoce: "invoice",
  invoics: "invoices",
  expence: "expense",
  expences: "expenses",
  taxs: "taxes",
  deducitons: "deductions",
  dedctions: "deductions",
  parsel: "parcel",
  parsels: "parcels",
  acerage: "acreage",
  zonning: "zoning",
  phising: "phishing",
  phishng: "phishing",
  knowlege: "knowledge",
  itenerary: "itinerary",
  itinerery: "itinerary",
  resme: "resume",
  candiate: "candidate",
  candidte: "candidate",
  suport: "support",
  tcket: "ticket",
  tickts: "tickets",
  meting: "meeting",
  meetng: "meeting",
  trancript: "transcript",
  transcrip: "transcript",
  workfow: "workflow",
  workflw: "workflow",
  campain: "campaign",
  campaing: "campaign",
  neighboorhood: "neighborhood",
  neigborhood: "neighborhood",
  maintanance: "maintenance",
  maintenence: "maintenance",
  discloser: "disclosure",
  disclosurs: "disclosures",
  bookeeping: "bookkeeping",
  seperate: "separate",
  recieve: "receive",
  refrence: "reference",
  propertys: "properties",
  custmer: "customer",
  litrature: "literature",
  emial: "email",
  portfolo: "portfolio",
  investmnt: "investment",
};

const SPELLING: Record<string, string> = { ...SMB_SPELLING, ...EXTRA_SPELLING };

/** Words that must not be "fixed" into a nearby anchor. */
const DO_NOT_CORRECT = new Set([
  "deals", "deal", "house", "houses", "homes", "home", "rental", "rentals", "score",
  "rank", "flip", "commercial", "wedding", "cookbook", "garage", "property",
  "properties", "real", "estate", "cash", "flow", "reach", "realtor", "owner",
  "thread", "threads", "owners", "seller", "sellers", "plan", "write", "bake",
  "train", "organize", "shipping", "shipped", "comps", "comp", "agent", "agents",
]);

const FILLER = [
  /\bfor me to\b/g,
  /\bhelp me(?: to)?\b/g,
  /\bi need an? ai to\b/g,
  /\bi need an? ai that can\b/g,
  /\bi need an? ai\b/g,
  /\bplease\b/g,
  /\bcan you\b/g,
  /\bfind and agent to\b/g,
  /\bfind an agent to\b/g,
];

const ABBREVIATIONS: Array<[RegExp, string, string]> = [
  [/\bcmas?\b/g, "comparative market analysis", "cma"],
  [/\bbpos?\b/g, "broker price opinion", "bpo"],
  [/\bmls\b/g, "multiple listing service", "mls"],
  [/\bfsbos?\b/g, "for sale by owner", "fsbo"],
  [/\barvs?\b/g, "after repair value", "arv"],
  [/\bqbo\b/g, "quickbooks", "qbo"],
  [/\bap\/ar\b/g, "accounts payable and accounts receivable", "ap ar"],
  [/\ba\/p\b/g, "accounts payable", "ap"],
  [/\ba\/r\b/g, "accounts receivable", "ar"],
  [/\bcap\s*rates?\b/g, "cap rate capitalization rate", "cap rate"],
];

/** Tight groups. A hit on any member counts as every member. */
const SYNONYM_GROUPS: string[][] = [
  ["comps", "comp", "comparable", "comparables", "comparison", "comparisons"],
  ["cma", "cmas"],
  ["bpo", "bpos"],
  ["arv", "arvs"],
  ["fsbo", "fsbos"],
  ["invoice", "invoices", "invoicing"],
  ["tax", "taxes", "taxation"],
  ["listing", "listings"],
  ["description", "descriptions", "remarks"],
  ["buyer", "buyers"],
  ["seller", "sellers"],
  ["showing", "showings"],
  ["tenant", "tenants"],
  ["disclosure", "disclosures"],
  ["photo", "photos", "picture", "pictures", "image", "images"],
  ["video", "videos"],
  ["reel", "reels"],
  ["neighborhood", "neighbourhood"],
  ["followup", "follow-up"],
];

const LEMMAS: Record<string, string> = {
  pricing: "price",
  priced: "price",
  scheduling: "schedule",
  scheduled: "schedule",
  filing: "file",
  filed: "file",
  editing: "edit",
  edited: "edit",
  writing: "write",
  written: "write",
  drafting: "draft",
  drafted: "draft",
  booking: "book",
  booked: "book",
  planning: "plan",
  planned: "plan",
  sending: "send",
  sent: "send",
  creating: "create",
  created: "create",
  making: "make",
  finding: "find",
  managing: "manage",
  managed: "manage",
  analyzing: "analyze",
  processing: "process",
  processed: "process",
  reconciling: "reconcile",
  reconciled: "reconcile",
  categorizing: "categorize",
  categorized: "categorize",
  nurturing: "nurture",
  prospecting: "prospect",
  staging: "stage",
  staged: "stage",
  selling: "sell",
  sold: "sold",
  comparing: "compare",
  compared: "compare",
};

const synonymIndex = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const set = new Set(group);
  for (const word of group) synonymIndex.set(word, set);
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = a[i - 1] === b[j - 1] ? previous : 1 + Math.min(previous, row[j], row[j - 1]);
      previous = saved;
    }
  }
  return row[b.length];
}

const PROTECT = new Set([
  ...CONCEPTS.flatMap((concept) => concept.anchors),
  ...CONCEPTS.flatMap((concept) => concept.phrases.join(" ").split(/\s+/)),
  ...SYNONYM_GROUPS.flat(),
  ...Object.values(SPELLING),
].filter((word) => /^[a-z0-9]+$/.test(word)));

const SPELL_TARGETS = [...new Set([
  ...CONCEPTS.flatMap((concept) => concept.anchors),
  ...Object.values(SPELLING),
])].filter((word) => word.length >= 5 && /^[a-z0-9]+$/.test(word));

function spell(token: string): string {
  if (SPELLING[token]) return SPELLING[token];
  if (token.length < 6 || DO_NOT_CORRECT.has(token)) return token;
  if (PROTECT.has(token)) return token;
  let match: string | null = null;
  for (const candidate of SPELL_TARGETS) {
    if (candidate[0] !== token[0]) continue;
    if (token === `${candidate}s` || token === `${candidate}es`) continue;
    if (editDistance(token, candidate) !== 1) continue;
    if (match) return token;
    match = candidate;
  }
  return match ?? token;
}

export function stemToken(token: string): string {
  if (LEMMAS[token]) return LEMMAS[token];
  if (token.length <= 4) return token;
  if (token.endsWith("ies") && token.length > 5) return `${token.slice(0, -3)}y`;
  if (/(?:ss|sh|ch|x|z)es$/.test(token) && token.length > 4) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss") && !token.endsWith("us") && !token.endsWith("is")) {
    return token.slice(0, -1);
  }
  return token;
}

function expandToken(token: string): string[] {
  const stemmed = stemToken(token);
  const out = new Set<string>([token, stemmed]);
  for (const key of [token, stemmed]) {
    const group = synonymIndex.get(key);
    if (!group) continue;
    for (const word of group) out.add(word);
  }
  return [...out];
}

export type PreparedQuery = {
  text: string;
  tokens: Set<string>;
};

export function prepareQuery(raw: string): PreparedQuery {
  let text = raw.toLowerCase().replace(/[“”‘’"'`]+/g, " ");
  text = text.replace(/&/g, " and ");
  text = text.replace(/[^a-z0-9\s/-]+/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  for (const pattern of FILLER) text = text.replace(pattern, " ");
  text = text.replace(/\s+/g, " ").trim();
  const additions: string[] = [];
  for (const [pattern, expansion, keep] of ABBREVIATIONS) {
    pattern.lastIndex = 0;
    if (!pattern.test(text)) continue;
    pattern.lastIndex = 0;
    if (text.includes(expansion)) continue;
    text = text.replace(pattern, keep);
    additions.push(expansion);
  }
  if (additions.length > 0) text = `${text} ${additions.join(" ")}`.replace(/\s+/g, " ").trim();
  text = text.replace(/[a-z0-9]+/g, (token) => spell(token));
  text = text.replace(/\s+/g, " ").trim();
  const tokens = new Set<string>();
  for (const token of text.match(/[a-z0-9]+/g) ?? []) {
    for (const expanded of expandToken(token)) tokens.add(expanded);
  }
  return { text, tokens };
}

/** Character trigrams for the no-model semantic backstop. */
export function trigrams(text: string): Set<string> {
  const padded = `  ${text.toLowerCase().replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim()} `;
  const set = new Set<string>();
  for (let index = 0; index < padded.length - 2; index++) set.add(padded.slice(index, index + 3));
  return set;
}

export function trigramJaccard(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return shared / (left.size + right.size - shared);
}

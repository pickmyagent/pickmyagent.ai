import { CONCEPTS, CONCEPT_THRESHOLD, type Concept } from "./concepts.ts";
import { prepareQuery, stemToken, trigramJaccard, type PreparedQuery } from "./match-text.ts";
import { blockRealEstateConcept } from "./real-estate-match.ts";

/**
 * Browser-side backstop. No model download and no paid API.
 * It runs only when the lexicon misses, and only on distinctive words,
 * so "house", "agent", or "automate" alone cannot pull a job.
 */

const BROAD = new Set([
  "automate", "automation", "automated", "automating", "agent", "agents",
  "house", "houses", "home", "homes", "property", "properties", "help",
  "business", "tool", "tools", "make", "find", "need", "want", "best",
  "good", "real", "estate", "listing", "listings", "work", "task", "tasks",
  "thing", "things", "something", "please", "just", "with", "from", "your",
  "deal", "deals",
  "that", "this", "have", "into", "about", "using", "used", "use",
]);

const GLOSS: Record<string, string> = {
  cma: "comparable sales comps cma bpo pricing a listing recently sold similar homes broker price opinion home value house worth listing presentation",
  "listing-copy": "mls listing description remarks property description copy for the listing",
  "listing-photos": "virtual staging listing photo edit enhancement day to dusk empty room",
  "listing-video": "listing video tour walkthrough realtor reel property video",
  "realtor-follow-up": "follow up nurture buyers sellers sphere past clients drip",
  "realtor-crm": "real estate crm for buyers sellers and listing leads",
  showings: "open house showing schedule lockbox tour appointment",
  transaction: "transaction coordinator disclosures closing paperwork purchase agreement",
  "market-report": "neighborhood market update market report for clients housing stats",
  prospecting: "expired listings farming sphere of influence circle prospecting",
  "agent-social": "social posts instagram facebook for realtors and listings",
  "property-mgmt": "property management tenants rent collection maintenance requests leases",
  offmarket: "for sale by owner fsbo off market motivated seller skip trace",
  land: "vacant land parcel acreage zoning lot",
  deals: "rental comps cap rate arv flip cash flow rank property deals",
  taxes: "file taxes tax return deductions 1040 quarterly estimated",
  bookkeeping: "quickbooks qbo reconcile categorize books bookkeeping cleanup",
  invoices: "accounts payable receivable invoices billing expenses receipts",
  support: "customer support ticket refund help center chatbot",
  sales: "cold email qualify leads sales outreach crm pipeline",
  email: "email inbox gmail triage draft replies",
  schedule: "calendar scheduling meetings reminders appointments",
  content: "blog post seo article marketing copy",
  hiring: "screen candidates resume hiring recruit onboarding",
  travel: "plan a trip flights hotels itinerary book travel",
  shopping: "shop products price comparison recommendations",
  knowledge: "knowledge base wiki policy lookup document questions",
  social: "social media posts instagram schedule captions",
  helpdesk: "it help desk password reset ticket",
  security: "phishing threat hunting soc alert malware",
  research: "literature review deep research competitive analysis market research",
  tutoring: "tutor homework study plan practice problems",
  video: "highlight reel clip youtube short twitch stream",
  "video-generation": "cinematic text to video image to video camera move",
  voice: "text to speech voiceover narration",
  image: "text to image concept art",
  "three-d": "3d model text to 3d",
  avatar: "avatar video talking head spokesperson",
  resume: "write my resume cv cover letter",
  code: "write code debug pull request coding agent github",
  workflow: "workflow automation zapier repeated task",
  crew: "multi agent crew",
  rag: "vector database rag retrieval crawler",
  meetings: "meeting notes transcript action items",
  browser: "browser agent fill forms computer use",
  npc: "game npc dialogue character",
  invest: "investment portfolio stocks brokerage 401k rebalance",
  payroll: "run payroll paychecks paystubs",
  "sales-tax": "sales tax vat return gst",
  shifts: "schedule shifts rota roster",
  reviews: "google reviews review request reputation",
  quotes: "draft a quote proposal estimate",
  contracts: "draft a contract service agreement",
  "customer-follow-up": "follow up with customers thank you notes",
  "small-business": "small business run my business",
  language: "learn spanish french german japanese language practice",
  promotions: "marketing promotion promo coupon discount campaign",
  newsletter: "email newsletter",
  commerce: "shopify etsy inventory shipping labels",
  "books-reports": "profit and loss cash flow budget forecast dashboard",
};

function conceptTerms(concept: Concept): Set<string> {
  const blob = [
    concept.phrases.join(" "),
    concept.anchors.join(" "),
    (concept.bags ?? []).flat().join(" "),
    GLOSS[concept.id] ?? "",
  ].join(" ");
  const terms = new Set<string>();
  for (const token of blob.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    if (BROAD.has(token) || token.length < 3) continue;
    terms.add(token);
    terms.add(stemToken(token));
  }
  return terms;
}

const TERM_SETS = new Map(CONCEPTS.map((concept) => [concept.id, conceptTerms(concept)]));

const DOCUMENT_FREQUENCY = new Map<string, number>();
for (const terms of TERM_SETS.values()) {
  for (const term of terms) DOCUMENT_FREQUENCY.set(term, (DOCUMENT_FREQUENCY.get(term) ?? 0) + 1);
}

function distinctive(term: string): boolean {
  if (BROAD.has(term) || term.length < 4) return false;
  return (DOCUMENT_FREQUENCY.get(term) ?? 99) <= 2;
}

export type SemanticHit = { id: string; score: number };

export function semanticHits(raw: string): SemanticHit[] {
  const prepared: PreparedQuery = prepareQuery(raw);
  const content = [...prepared.tokens].filter((token) => !BROAD.has(token) && token.length >= 4);
  if (content.length === 0) return [];
  const scored: SemanticHit[] = [];
  for (const concept of CONCEPTS) {
    if (blockRealEstateConcept(concept.id, prepared.text)) continue;
    const terms = TERM_SETS.get(concept.id);
    if (!terms) continue;
    let overlap = 0;
    for (const token of content) {
      if (!distinctive(token)) continue;
      if (terms.has(token) || terms.has(stemToken(token))) overlap += 1;
    }
    let similarity = 0;
    const probes = [...concept.phrases, GLOSS[concept.id] ?? ""].filter(Boolean);
    for (const probe of probes) {
      similarity = Math.max(similarity, trigramJaccard(prepared.text, probe));
    }
    const lexicalMiss = overlap >= 2 || (overlap >= 1 && similarity >= 0.55);
    if (!lexicalMiss) continue;
    const score = overlap * 5 + Math.round(similarity * 12);
    if (score >= CONCEPT_THRESHOLD) scored.push({ id: concept.id, score });
  }
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  if (scored.length === 0) return [];
  if (scored.length > 1 && scored[0].score - scored[1].score < 3) return [];
  return scored.slice(0, 1);
}

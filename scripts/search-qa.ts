import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CONCEPTS } from "../lib/concepts.ts";
import { matchTagsForConcept } from "../lib/search.ts";
import { smokeLabel } from "../lib/labels.ts";
import { rankCatalogQuery } from "../lib/search.ts";
import { releaseLabel, toolPageChromeStrings } from "../lib/tool-page-copy.ts";
import type { Catalog, Tool } from "../lib/types.ts";
import { BROKEN_ASSISTANT, descriptionProblems, grammarProblems, headerUsesBrokenPhrase, specialistWhyProblems, toolPageBulletProblems, toolPageCopyProblems } from "./grammar-gate.ts";

export type QaQuery = {
  query: string;
  domain: string | null;
  /** Each listed use case must show a specialist, and every specialist must belong to one of them. */
  jobs?: string[];
};

/** Realistic searches: use-case jobs, wrappers, caps, typos, punctuation, questions, and unrelated work. */
export const QA_QUERIES: QaQuery[] = [
  { query: "find homes for sale by owner", domain: "find-off-market" },
  { query: "use an agent for motivated sellers", domain: "find-off-market" },
  { query: "fsbo near me", domain: "find-off-market" },
  { query: "I need AI to skip trace an owner", domain: "find-off-market" },
  { query: "best tool for off-market deals", domain: "find-off-market" },
  { query: "is there an AI that can find for sale by owner homes", domain: "find-off-market" },
  { query: "vacant lot in texas", domain: "find-land" },
  { query: "find land", domain: "find-land" },
  { query: "I need AI to find a parcel", domain: "find-land" },
  { query: "LAND", domain: "find-land" },
  { query: "use an agent for acreage in Florida", domain: "find-land" },
  { query: "zoning for this parcel", domain: "find-land" },
  { query: "find commercial real estate deals", domain: "rank-property-deals" },
  { query: "rank rental properties by cash flow", domain: "rank-property-deals" },
  { query: "score houses to flip", domain: "rank-property-deals" },
  { query: "best tool for ranking real estate deals", domain: "rank-property-deals" },
  { query: "which tool ranks rental properties", domain: "rank-property-deals" },
  { query: "Find real estate deals and rank them", domain: "rank-property-deals" },
  { query: "investment portfolio", domain: "manage-portfolio" },
  { query: "Use an agent for my investment portfolio", domain: "manage-portfolio" },
  { query: "stock portfolio", domain: "manage-portfolio" },
  { query: "manage my 401k", domain: "manage-portfolio" },
  { query: "I need AI to rebalance my brokerage account", domain: "manage-portfolio" },
  { query: "portfolo", domain: "manage-portfolio" },
  { query: "agent for taxes", domain: "do-taxes" },
  { query: "file my taxes", domain: "do-taxes" },
  { query: "do my taxes?", domain: "do-taxes" },
  { query: "TAXES", domain: "do-taxes" },
  { query: "file my 1040", domain: "do-taxes" },
  { query: "is there an AI that can sort my deductions", domain: "do-taxes" },
  { query: "customer support tickets", domain: "customer-support" },
  { query: "I need AI to handle a refund", domain: "customer-support" },
  { query: "help center for order status", domain: "customer-support" },
  { query: "best tool for support tickets", domain: "customer-support" },
  { query: "use an agent for customer support", domain: "customer-support" },
  { query: "cold email to leads", domain: "sales-outreach" },
  { query: "is there an AI that can draft a cold email", domain: "sales-outreach" },
  { query: "qualify leads", domain: "sales-outreach" },
  { query: "best tool for sales outreach", domain: "sales-outreach" },
  { query: "I need AI to update my CRM pipeline", domain: "sales-outreach" },
  { query: "email inbox", domain: "manage-inbox" },
  { query: "triage my gmail", domain: "manage-inbox" },
  { query: "inbox", domain: "manage-inbox" },
  { query: "use an agent for my email inbox", domain: "manage-inbox" },
  { query: "draft replies to email threads", domain: "manage-inbox" },
  { query: "INBOX!!!", domain: "manage-inbox" },
  { query: "calendar management", domain: "scheduling-assistant" },
  { query: "best tool for calendar management", domain: "scheduling-assistant" },
  { query: "I need AI to manage my calendar", domain: "scheduling-assistant" },
  { query: "is there an AI that can manage my calendar", domain: "scheduling-assistant" },
  { query: "reminders for next week", domain: "scheduling-assistant" },
  { query: "write a blog post", domain: "create-content" },
  { query: "seo article", domain: "create-content" },
  { query: "marketing copy", domain: "create-content" },
  { query: "best tool for blog posts", domain: "create-content" },
  { query: "I need AI to optimize content", domain: "create-content" },
  { query: "SEO", domain: "create-content" },
  { query: "analyze data", domain: "analyze-data" },
  { query: "data analysis for a spreadsheet", domain: "analyze-data" },
  { query: "generate reports", domain: "analyze-data" },
  { query: "best tool for data analysis", domain: "analyze-data" },
  { query: "I need AI to analyze my spreadsheet", domain: "analyze-data" },
  { query: "screen candidates", domain: "hire-candidates" },
  { query: "resume review", domain: "write-resume" },
  { query: "source candidates", domain: "hire-candidates" },
  { query: "use an agent for hiring", domain: "hire-candidates" },
  { query: "best tool for resume review", domain: "write-resume" },
  { query: "resume review for this applicant", domain: "hire-candidates" },
  { query: "plan a trip", domain: "plan-travel" },
  { query: "book travel", domain: "plan-travel" },
  { query: "is there an AI that can plan my trip", domain: "plan-travel" },
  { query: "BOOK MY TRIP", domain: "plan-travel" },
  { query: "book a hotel in lisbon", domain: "plan-travel" },
  { query: "I need AI to build an itinerary", domain: "plan-travel" },
  { query: "price comparison", domain: "shop-products" },
  { query: "recommend products", domain: "shop-products" },
  { query: "shop for running shoes", domain: "shop-products" },
  { query: "best tool for product recommendations", domain: "shop-products" },
  { query: "I need AI to shop for headphones", domain: "shop-products" },
  { query: "accounts payable", domain: "finance-ops" },
  { query: "process invoices", domain: "finance-ops" },
  { query: "purchase order", domain: "finance-ops" },
  { query: "invoices", domain: "finance-ops" },
  { query: "best tool for finance ops", domain: "finance-ops" },
  { query: "knowledge base", domain: "knowledge-qa" },
  { query: "enterprise search", domain: "knowledge-qa" },
  { query: "policy lookup", domain: "knowledge-qa" },
  { query: "is there an AI that can answer from our wiki", domain: "knowledge-qa" },
  { query: "document q&a", domain: "knowledge-qa" },
  { query: "social media", domain: "social-media" },
  { query: "best tool for social media posts", domain: "social-media" },
  { query: "I need AI to draft a social media post", domain: "social-media" },
  { query: "use an agent for social media", domain: "social-media" },
  { query: "MANAGE SOCIAL MEDIA", domain: "social-media" },
  { query: "help desk ticket", domain: "it-helpdesk" },
  { query: "password reset", domain: "it-helpdesk" },
  { query: "it help", domain: "it-helpdesk" },
  { query: "best tool for the help desk", domain: "it-helpdesk" },
  { query: "I need AI to reset a password", domain: "it-helpdesk" },
  { query: "phishing report", domain: "security-ops" },
  { query: "threat hunting", domain: "security-ops" },
  { query: "security triage", domain: "security-ops" },
  { query: "is there an AI that can review a phishing email", domain: "security-ops" },
  { query: "soc alert", domain: "security-ops" },
  { query: "literature review", domain: "deep-research" },
  { query: "deep research", domain: "deep-research" },
  { query: "market research", domain: "deep-research" },
  { query: "competitive analysis", domain: "deep-research" },
  { query: "best tool for a literature review", domain: "deep-research" },
  { query: "study plan", domain: "tutoring" },
  { query: "practice problems", domain: "tutoring" },
  { query: "personalized learning", domain: "tutoring" },
  { query: "I need AI to tutor me", domain: "tutoring" },
  { query: "best tool for homework", domain: "tutoring" },
  { query: "sizzle reel", domain: "game-creative" },
  { query: "highlight reel", domain: "game-creative" },
  { query: "youtube short", domain: "game-creative" },
  { query: "use an agent to clip my twitch stream", domain: "game-creative" },
  { query: "best tool for a highlight reel", domain: "game-creative" },
  { query: "write code", domain: "coding-agents" },
  { query: "pull request", domain: "coding-agents" },
  { query: "coding agent", domain: "coding-agents" },
  { query: "code", domain: "coding-agents" },
  { query: "I need AI to debug this function", domain: "coding-agents" },
  { query: "USE AI TO WRITE CODE", domain: "coding-agents" },
  { query: "automate my workflow", domain: "workflow-automation" },
  { query: "workflow", domain: "workflow-automation" },
  { query: "best tool for workflow automation", domain: "workflow-automation" },
  { query: "I need AI to automate a repeated task", domain: "workflow-automation" },
  { query: "multi-tool workflow", domain: "workflow-automation" },
  { query: "multi-agent crew", domain: "multi-agent-workflows" },
  { query: "agent crew", domain: "multi-agent-workflows" },
  { query: "best tool for a multi-agent workflow", domain: "multi-agent-workflows" },
  { query: "I need AI to run an agent crew", domain: "multi-agent-workflows" },
  { query: "vector database", domain: "research-rag" },
  { query: "rag", domain: "research-rag" },
  { query: "best tool for a vector database", domain: "research-rag" },
  { query: "I need AI to crawl source pages", domain: "research-rag" },
  { query: "meeting notes", domain: "meetings-knowledge" },
  { query: "action items from the transcript", domain: "meetings-knowledge" },
  { query: "transcribe my meeting", domain: "meetings-knowledge" },
  { query: "best tool for meeting notes", domain: "meetings-knowledge" },
  { query: "browser agent", domain: "tool-use-browser" },
  { query: "fill forms", domain: "tool-use-browser" },
  { query: "computer use", domain: "tool-use-browser" },
  { query: "I need AI to run a browser task", domain: "tool-use-browser" },
  { query: "browser", domain: "tool-use-browser" },
  { query: "game npcs", domain: "game-npcs" },
  { query: "npc dialogue", domain: "game-npcs" },
  { query: "in-game character", domain: "game-npcs" },
  { query: "best tool for game NPCs", domain: "game-npcs" },
  { query: "NPC", domain: "game-npcs" },
  { query: "AI for my small business", domain: null },
  { query: "best AI tool for real estate", domain: "real-estate" },
  { query: "Help me with my resume", domain: "write-resume" },
  { query: "USE AI TO WRITE EMAILS", domain: null },
  { query: "plan a wedding", domain: null },
  { query: "write a cookbook", domain: null },
  { query: "train my dog", domain: null },
  { query: "organize my garage", domain: null },
  { query: "bake a cake", domain: null },
  { query: "meal prep for the week", domain: null },
  { query: "fix my car", domain: null },
  { query: "paint the bedroom", domain: null },
  { query: "plan a birthday party", domain: null },
  { query: "start a book club", domain: null },
  { query: "learn piano", domain: null },
  { query: "pack for a move", domain: null },
  { query: "name a baby", domain: null },
  { query: "grocery list", domain: null },
  { query: "water the garden", domain: null },
  { query: "fold the laundry", domain: null },
  { query: "taxes?", domain: "do-taxes" },
  { query: "plan a trip!", domain: "plan-travel" },
  { query: "my inbox...", domain: "manage-inbox" },
  { query: "write code???", domain: "coding-agents" },
  { query: "what AI can file my taxes", domain: "do-taxes" },
  { query: "how do I plan a trip", domain: "plan-travel" },
  { query: "which tool should screen candidates", domain: "hire-candidates" },
  { query: "investmnt portfolio", domain: "manage-portfolio" },
  { query: "custmer support", domain: "customer-support" },
  { query: "litrature review", domain: "deep-research" },
  { query: "emial inbox", domain: "manage-inbox" },
  { query: "so I was wondering if there is an AI that can help me do my taxes this year please", domain: "do-taxes" },
  { query: "hey can you use an agent for my email inbox, I keep missing replies", domain: "manage-inbox" },
  { query: "ok I need AI to plan a trip to Lisbon and also compare hotels and maybe flights", domain: "plan-travel" },
  { query: "I have been trying to figure out my investment portfolio and I just need something that can compare fees", domain: "manage-portfolio" },
  { query: "please find an agent that will write a blog post about sourdough", domain: "create-content" },
  { query: "can you help me with a password reset for a new hire", domain: "it-helpdesk" },
  { query: "is there an AI that can turn meeting notes into action items", domain: "meetings-knowledge" },
  { query: "best tool for invoices", domain: "finance-ops" },
  { query: "use an agent to fill forms on a website", domain: "tool-use-browser" },
  { query: "I want an agent that will source candidates", domain: "hire-candidates" },
  { query: "find me a tool for threat hunting", domain: "security-ops" },
  { query: "looking for an AI tool to book travel", domain: "plan-travel" },
  { query: "help me draft a cold email", domain: "sales-outreach" },
  { query: "agent for my calendar", domain: "scheduling-assistant" },
  { query: "AI for NPCs", domain: "game-npcs" },
  { query: "tool for a vector database", domain: "research-rag" },
  { query: "something for workflow automation", domain: "workflow-automation" },
  { query: "who can clip a youtube short", domain: "game-creative" },
  { query: "?? taxes", domain: "do-taxes" },
  { query: "portfolio!", domain: "manage-portfolio" },
  { query: "DEBUG MY CODE", domain: "coding-agents" },
  { query: "workflow?", domain: "workflow-automation" },
  { query: "shop", domain: "shop-products" },
  { query: "research", domain: "deep-research" },
  { query: "meeting", domain: "meetings-knowledge" },
  { query: "invoice", domain: "finance-ops" },
  { query: "refund", domain: "customer-support" },
  { query: "phishing", domain: "security-ops" },
  { query: "tutor", domain: "tutoring" },
  { query: "calendar", domain: "scheduling-assistant" },
  { query: "wiki", domain: "knowledge-qa" },
  { query: "make a cinematic video", domain: "video-generation" },
  { query: "AI video with camera moves", domain: "video-generation" },
  { query: "text to video", domain: "video-generation" },
  { query: "image to video", domain: "video-generation" },
  { query: "text to speech", domain: "voice-audio" },
  { query: "make a 3d model", domain: "make-3d" },
  { query: "text to image", domain: "make-images" },
  { query: "concept art", domain: "make-images" },
  { query: "edit listing videos for real estate", domain: "listing-videos" },
  { query: "make a video tour of a house", domain: "listing-videos" },
  { query: "realtor video editing", domain: "listing-videos" },
  { query: "property walkthrough video", domain: "listing-videos" },
  { query: "turn listing photos into a video", domain: "listing-videos" },
  { query: "AI avatar video", domain: "avatar-video" },
  { query: "talking head video", domain: "avatar-video" },
  { query: "spokesperson video", domain: "avatar-video" },
  { query: "video of me talking without filming", domain: "avatar-video" },
  { query: "screen a resume", domain: "hire-candidates" },
  { query: "write my resume", domain: "write-resume" },
  { query: "k-5 math tutor", domain: "tutoring" },
  { query: "math for kids", domain: "tutoring" },
  { query: "3rd grade math", domain: "tutoring" },
  { query: "cheap AI model for coding", domain: "coding-agents" },
  { query: "deepseek alternative", domain: "coding-agents" },
  { query: "chatgpt alternative", domain: null },
  { query: "learn spanish", domain: "learn-language" },
  { query: "language practice", domain: "learn-language" },
  {
    query: "I want to find a tool to help me automate marketing promotions, and sending invoices to customers",
    domain: null,
    jobs: ["marketing-promotions", "finance-ops", "workflow-automation"],
  },
  { query: "track expenses and file my taxes", domain: null, jobs: ["finance-ops", "do-taxes"] },
  { query: "schedule meetings and take notes", domain: null, jobs: ["scheduling-assistant", "meetings-knowledge"] },
  { query: "write blog posts and post them to social", domain: null, jobs: ["create-content", "social-media"] },
  { query: "find leads and email them", domain: "sales-outreach", jobs: ["sales-outreach"] },
  { query: "answer support tickets and update the knowledge base", domain: null, jobs: ["customer-support", "knowledge-qa"] },
  { query: "edit listing videos and post to instagram", domain: null, jobs: ["listing-videos", "social-media"] },
  { query: "send customer invoices and automate promo campaigns", domain: null, jobs: ["finance-ops", "marketing-promotions", "workflow-automation"] },
  { query: "bill clients and draft a blog post", domain: null, jobs: ["finance-ops", "create-content"] },
  { query: "file my taxes & track my expenses", domain: null, jobs: ["do-taxes", "finance-ops"] },
  { query: "take meeting notes and schedule the follow-up", domain: null, jobs: ["meetings-knowledge", "scheduling-assistant"] },
  { query: "draft a cold email and update the CRM", domain: "sales-outreach", jobs: ["sales-outreach"] },
  { query: "clip a youtube short and post it to instagram", domain: null, jobs: ["game-creative", "social-media"] },
  { query: "make a listing video and find off-market deals", domain: null, jobs: ["listing-videos", "find-off-market"] },
  { query: "screen candidates and schedule interviews", domain: "hire-candidates", jobs: ["hire-candidates"] },
  { query: "analyze a spreadsheet and write a blog post", domain: null, jobs: ["analyze-data", "create-content"] },
  { query: "plan a trip and shop for luggage", domain: null, jobs: ["plan-travel", "shop-products"] },
  { query: "reset a password and answer a support ticket", domain: null, jobs: ["it-helpdesk", "customer-support"] },
  { query: "do my taxes plus manage my portfolio", domain: null, jobs: ["do-taxes", "manage-portfolio"] },
  { query: "find land and rank rental properties", domain: null, jobs: ["find-land", "rank-property-deals"] },
  { query: "write my resume and screen candidates", domain: null, jobs: ["write-resume", "hire-candidates"] },
  { query: "transcribe my meeting and draft the follow-up email", domain: null, jobs: ["meetings-knowledge", "manage-inbox"] },
  { query: "generate a voice track and make a cinematic video", domain: null, jobs: ["voice-audio", "video-generation"] },
  { query: "tutor me in math and learn spanish", domain: null, jobs: ["tutoring", "learn-language"] },
  { query: "fill out forms and qualify leads", domain: null, jobs: ["tool-use-browser", "sales-outreach"] },
  { query: "monitor phishing and reset passwords", domain: null, jobs: ["security-ops", "it-helpdesk"] },
  { query: "create social posts and write an SEO article", domain: null, jobs: ["social-media", "create-content"] },
  { query: "process invoices and do my taxes", domain: null, jobs: ["finance-ops", "do-taxes"] },
  { query: "book a hotel and clip my twitch stream", domain: null, jobs: ["plan-travel", "game-creative"] },
  { query: "schedule meetings, also take notes", domain: null, jobs: ["scheduling-assistant", "meetings-knowledge"] },
];

const PROPER = new Set([
  "south", "carolina", "california", "texas", "florida", "york", "lisbon", "london",
  "seo", "api", "crm", "gpt", "irs", "npc", "npcs", "pdf", "fsbo", "rag", "soc", "gmail",
  "youtube", "google", "anthropic", "instagram", "k5",
  "openai", "nvidia", "github", "discord", "youtube", "twitch", "amazon", "duolingo",
  "spanish", "french", "german", "japanese", "instagram",
  "microsoft", "python", "hex", "notion", "slack",
]);

const WRAPPER =
  /\b(use an agent(?:\s+(?:for|to))?|use an ai\s+(?:to|for)|i need an? ai|i need ai to|i want an? agent|i want to find|find an agent|find me an|is there an ai|best tool for|best ai(?:\s+(?:tool|agent))?|help me|can you)\b/i;

const INTERNAL =
  /\bHTTP\s*\d{3}\b|\breturned\s+\d{3}\b|\(\d{3}\)|\b\d{3}['’]d\b|\bour checker\b|\bour client\b|\bautomated clients?\b|\bthis environment\b|\bwe did not sign up\b|\b(?:homepage|docs)(?:\s+and\s+[a-z]+)?\s+checked\b|\bnot fully checked\b|\bthis listing is untested\b|\blisting stays untested\b|\bnot smoke-tested\b|\bsmoke-tested\b|\bnode-gyp\b|\bdistutils\b|\bour check\b|\bon our check\b|CHANGED\/NOTE|\bthis check\b|\bnpm install\b|\bparts of\b|\bso you can find an agent\b/i;

const DOUBLED = /\b([A-Za-z]+)\s+\1\b/i;

const PROSE_KEYS = new Set([
  "shortDescription", "longDescription", "strength", "weakness", "freeTierNotes",
  "smokeTestNotes", "pricingNotes", "bestFor", "notIdealFor", "problems", "useCaseFit",
  "why", "summary", "intro", "title", "disclaimer",
]);

/** Fields and lists that render on a tool page. Why-lines and intros are not in this set. */
const TOOL_PAGE_KEYS = new Set([
  "shortDescription", "longDescription", "strength", "weakness", "freeTierNotes", "freeTrial",
  "smokeTestNotes", "bestFor", "notIdealFor", "problems",
]);

export type QaCard = {
  name: string;
  label: string;
  why: string;
};

export type QaRow = {
  query: string;
  domain: string | null;
  header: string;
  intro: string;
  cards: QaCard[];
};

function allowedWords(query: string, tools: Tool[]): Set<string> {
  const allowed = new Set(PROPER);
  const shouted = query === query.toUpperCase() && /[A-Z]/.test(query);
  if (!shouted) {
    for (const word of query.match(/[A-Za-z][A-Za-z'-]*/g) ?? []) {
      if (word.length > 1 && word[0] === word[0].toUpperCase() && word.slice(1) !== word.slice(1).toUpperCase()) {
        allowed.add(word.toLowerCase());
      }
    }
  }
  for (const tool of tools) {
    for (const word of `${tool.name} ${tool.assistantName ?? ""}`.match(/[A-Za-z][A-Za-z0-9'-]*/g) ?? []) {
      allowed.add(word.toLowerCase());
    }
  }
  return allowed;
}

function capitalIssues(text: string, allowed: Set<string>): string[] {
  const issues: string[] = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    const tokens = sentence.match(/[A-Za-z][A-Za-z0-9'’-]*/g) ?? [];
    tokens.forEach((word, index) => {
      if (index === 0 || word.length < 2) return;
      if (word[0] !== word[0].toUpperCase() || word[0] === word[0].toLowerCase()) return;
      if (/^[A-Z0-9]{2,5}$/.test(word)) return;
      if (/[A-Z]/.test(word.slice(1))) return;
      const bare = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (allowed.has(bare)) return;
      issues.push(word);
    });
  }
  return issues;
}

function specialistMatchesJob(tool: Tool, job: string, catalog: Catalog): boolean {
  const concept = CONCEPTS.find((entry) => entry.useCase === job);
  if (!concept) return false;
  const tags = matchTagsForConcept(concept, catalog.useCases);
  if (!tool.useCaseTags.some((tag) => tags.includes(tag))) return false;
  return tool.categories.every((category) => concept.categories.includes(category));
}

function cardLabel(general: boolean, status: Tool["smokeStatus"]): string {
  const role = general ? "General-purpose AI assistant" : "Specialist";
  return `${role} · ${smokeLabel(status)}`;
}

export function runSearchQa(catalog: Catalog): QaRow[] {
  return QA_QUERIES.map((item) => {
    const ranked = rankCatalogQuery(item.query, catalog);
    return {
      query: item.query,
      domain: item.domain,
      header: ranked.lead,
      intro: ranked.intro,
      cards: ranked.tools.map((tool) => ({
        name: tool.name,
        label: cardLabel(tool.generalPurpose, tool.smokeStatus),
        why: tool.whyItHelps,
      })),
    };
  });
}

export function qaProblems(catalog: Catalog): string[] {
  const problems: string[] = [];
  const bySlug = new Map(catalog.tools.map((tool) => [tool.slug, tool]));
  if (QA_QUERIES.length < 200) problems.push(`expected at least 200 queries, found ${QA_QUERIES.length}`);
  const seen = new Set<string>();
  for (const item of QA_QUERIES) {
    const key = item.query.toLowerCase();
    if (seen.has(key)) problems.push(`duplicate query: ${item.query}`);
    seen.add(key);
    const ranked = rankCatalogQuery(item.query, catalog);
    const pageTools = ranked.tools
      .map((tool) => bySlug.get(tool.slug))
      .filter((tool): tool is Tool => Boolean(tool));
    const allowed = allowedWords(item.query, pageTools);
    const header = ranked.lead;
    const intro = ranked.intro;
    if (!/^For [a-z]/.test(header)) problems.push(`${item.query}: header does not start with a lowercase gerund: ${header}`);
    if (!/^AI (?:agents|assistants)\b/.test(intro)) problems.push(`${item.query}: intro does not start with AI agents or AI assistants: ${intro}`);
    for (const text of [header, intro]) {
      if (WRAPPER.test(text)) problems.push(`${item.query}: wrapper text in "${text}"`);
      if (/\bparts of\b/i.test(text)) problems.push(`${item.query}: parts of in "${text}"`);
      if (DOUBLED.test(text)) problems.push(`${item.query}: doubled word in "${text}"`);
      if (INTERNAL.test(text)) problems.push(`${item.query}: internal wording in "${text}"`);
      const caps = capitalIssues(text, allowed);
      if (caps.length > 0) problems.push(`${item.query}: mid-sentence capital ${caps.join(", ")} in "${text}"`);
      const grammar = grammarProblems(text, text === header ? "header" : "intro");
      if (grammar.length > 0) problems.push(`${item.query}: ${grammar.join("; ")} in "${text}"`);
    }
    const whys = ranked.tools.map((tool) => tool.whyItHelps);
    if (new Set(whys).size !== whys.length) problems.push(`${item.query}: duplicate why-line`);
    for (const tool of ranked.tools) {
      const why = tool.whyItHelps.trim();
      if (!why) problems.push(`${item.query}: empty why-line for ${tool.name}`);
      if (WRAPPER.test(why)) problems.push(`${item.query}: wrapper text in ${tool.name} why: ${why}`);
      if (/\bparts of\b/i.test(why) || /\bwhile you\b/i.test(why)) {
        problems.push(`${item.query}: awkward why for ${tool.name}: ${why}`);
      }
      if (DOUBLED.test(why)) problems.push(`${item.query}: doubled word in ${tool.name} why: ${why}`);
      if (INTERNAL.test(why)) problems.push(`${item.query}: internal wording in ${tool.name} why: ${why}`);
      const shouted = (why.match(/\b[A-Z]{5,}\b/g) ?? []).filter((word) => !allowed.has(word.toLowerCase()));
      if (shouted.length > 0) problems.push(`${item.query}: shouted ${shouted.join(", ")} in ${tool.name} why: ${why}`);
      const queryWords = new Set(item.query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
      const leaked = capitalIssues(why, allowed).filter((word) => queryWords.has(word.toLowerCase()));
      if (leaked.length > 0) problems.push(`${item.query}: query capital ${leaked.join(", ")} in ${tool.name} why: ${why}`);
      const grammar = grammarProblems(why, "why");
      if (grammar.length > 0) problems.push(`${item.query}: ${grammar.join("; ")} in ${tool.name} why: ${why}`);
      if (!tool.generalPurpose) {
        const specialist = specialistWhyProblems(tool.name, why);
        if (specialist.length > 0) problems.push(`${item.query}: ${specialist.join("; ")} in ${tool.name} why: ${why}`);
      }
    }
    const headerBody = header.replace(/^For\s+/i, "").replace(/,?\s*here'?s how each tool can help:\s*$/i, "");
    const brokenHeader = headerUsesBrokenPhrase(headerBody);
    if (brokenHeader) problems.push(`${item.query}: still renders header "${brokenHeader}"`);
    const whyText = whys.join(" ").toLowerCase();
    for (const banned of BROKEN_ASSISTANT) {
      if (whyText.includes(banned)) problems.push(`${item.query}: still renders "${banned}"`);
    }
    if (item.domain) {
      const got = ranked.useCases[0]?.slug ?? "none";
      if (got !== item.domain) problems.push(`${item.query}: expected ${item.domain}, ranked ${got}`);
      const concept = CONCEPTS.find((entry) => entry.useCase === item.domain);
      const useCase = catalog.useCases.find((entry) => entry.slug === item.domain);
      const categories = new Set(concept?.categories ?? []);
      const tags = useCase?.matchTags ?? [item.domain];
      for (const rankedTool of ranked.tools) {
        if (rankedTool.generalPurpose) continue;
        const source = bySlug.get(rankedTool.slug);
        if (!source) continue;
        if (!source.useCaseTags.some((tag) => tags.includes(tag))) {
          problems.push(`${item.query}: ${source.name} is off-domain for ${item.domain}`);
        }
        if (!source.categories.every((category) => categories.has(category))) {
          problems.push(`${item.query}: ${source.name} category is outside ${item.domain}`);
        }
      }
    }
    if (item.jobs && item.jobs.length > 1) {
      const slugs = new Set(ranked.useCases.map((useCase) => useCase.slug));
      for (const job of item.jobs) {
        if (job === "workflow-automation") continue;
        if (!slugs.has(job)) problems.push(`${item.query}: missing use case ${job}`);
      }
      for (const job of item.jobs) {
        const has = ranked.tools.some((rankedTool) => {
          if (rankedTool.generalPurpose) return false;
          const source = bySlug.get(rankedTool.slug);
          return Boolean(source && specialistMatchesJob(source, job, catalog));
        });
        if (!has) problems.push(`${item.query}: no specialist for ${job}`);
      }
      for (const rankedTool of ranked.tools) {
        if (rankedTool.generalPurpose) continue;
        const source = bySlug.get(rankedTool.slug);
        if (!source) continue;
        if (!item.jobs.some((job) => specialistMatchesJob(source, job, catalog))) {
          problems.push(`${item.query}: ${source.name} is off-domain for ${item.jobs.join(" + ")}`);
        }
      }
      if (/,\s+and\b/i.test(header)) problems.push(`${item.query}: comma before and in ${header}`);
      const queryWords = item.query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 2);
      for (const rankedTool of ranked.tools) {
        if (!rankedTool.generalPurpose) continue;
        const why = rankedTool.whyItHelps.toLowerCase();
        for (let index = 0; index + 9 <= queryWords.length; index++) {
          const span = queryWords.slice(index, index + 9).join(" ");
          if (why.includes(span)) {
            problems.push(`${item.query}: assistant why pastes the query: ${rankedTool.whyItHelps}`);
            break;
          }
        }
      }
    }
  }
  return problems;
}

function scanProse(value: unknown, path: string, problems: string[], toolPage: boolean): void {
  if (typeof value === "string") {
    if (INTERNAL.test(value)) problems.push(`${path}: ${value}`);
    if (/(?:shortDescription|longDescription)$/.test(path) && descriptionProblems(value).length > 0) {
      problems.push(`${path}: ${value}`);
    }
    if (toolPage && toolPageCopyProblems(value).length > 0) {
      problems.push(`${path}: ${value}`);
    }
    if (toolPage && /\.(?:bestFor|notIdealFor)(?:\[\d+\])?$/.test(path) && toolPageBulletProblems(value).length > 0) {
      problems.push(`${path}: ${value}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanProse(item, `${path}[${index}]`, problems, toolPage));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (!PROSE_KEYS.has(key) && !(toolPage && TOOL_PAGE_KEYS.has(key))) continue;
    scanProse(item, `${path}.${key}`, problems, toolPage && TOOL_PAGE_KEYS.has(key));
  }
}

export function catalogLeakProblems(catalog: Catalog): string[] {
  const problems: string[] = [];
  catalog.tools.forEach((tool) => {
    scanProse(tool, tool.slug, problems, true);
    if (tool.handsOn.detail && toolPageCopyProblems(tool.handsOn.detail).length > 0) {
      problems.push(`${tool.slug}.handsOn.detail: ${tool.handsOn.detail}`);
    }
    if (tool.latestRelease?.tag) {
      const label = releaseLabel(tool.latestRelease.tag);
      if (toolPageCopyProblems(label).length > 0) {
        problems.push(`${tool.slug}.latestRelease: ${label}`);
      }
    }
  });
  catalog.useCases.forEach((useCase) => scanProse(useCase, useCase.slug, problems, false));
  for (const text of toolPageChromeStrings()) {
    if (toolPageCopyProblems(text).length > 0) problems.push(`tool page chrome: ${text}`);
  }
  return problems;
}

export function renderSearchQaReport(catalog: Catalog): string {
  const rows = runSearchQa(catalog);
  const lines = [
    "# Search QA report",
    "",
    `${rows.length} queries through the ranker and the header, intro, and why-line renderers.`,
    "",
  ];
  rows.forEach((row, index) => {
    lines.push(`## ${index + 1}. ${row.query}`, "");
    lines.push(`- Header: ${row.header}`);
    lines.push(`- Intro: ${row.intro}`);
    if (row.domain) lines.push(`- Domain: ${row.domain}`);
    lines.push("- Cards:");
    if (row.cards.length === 0) lines.push("  - (no cards)");
    for (const card of row.cards) {
      lines.push(`  - ${card.name} — ${card.label} — ${card.why}`);
    }
    lines.push("");
  });
  return lines.join("\n");
}

const invoked = process.argv[1]?.includes("search-qa");
if (invoked) {
  const catalog = JSON.parse(readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8")) as Catalog;
  const problems = [...catalogLeakProblems(catalog), ...qaProblems(catalog)];
  const report = renderSearchQaReport(catalog);
  mkdirSync(new URL("../qa/", import.meta.url), { recursive: true });
  writeFileSync(new URL("../qa/search-qa-report.md", import.meta.url), report);
  console.log(`wrote qa/search-qa-report.md (${QA_QUERIES.length} queries)`);
  if (problems.length > 0) {
    console.error(problems.slice(0, 60).join("\n"));
    console.error(`${problems.length} problems`);
    process.exit(1);
  }
}

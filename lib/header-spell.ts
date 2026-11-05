/**
 * Spell and grammar check for a header built from the user's words.
 * A misspelling, a lowercase brand, or a broken fragment fails the check.
 * The caller then uses the job's canonical header or a category header.
 */

import { HEADER_DICTIONARY } from "./header-dictionary.ts";

/** Canonical casing. A lowercase form in a header is a failure until it is rewritten. */
export const HEADER_BRANDS: Record<string, string> = {
  facebook: "Facebook",
  google: "Google",
  quickbooks: "QuickBooks",
  freshbooks: "FreshBooks",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  gmail: "Gmail",
  shopify: "Shopify",
  etsy: "Etsy",
  xero: "Xero",
  zoho: "Zoho",
  slack: "Slack",
  zoom: "Zoom",
  chatgpt: "ChatGPT",
  deepseek: "DeepSeek",
  gemini: "Gemini",
  claude: "Claude",
  perplexity: "Perplexity",
  whatsapp: "WhatsApp",
  url: "URL",
  urls: "URLs",
  ai: "AI",
  seo: "SEO",
  api: "API",
  crm: "CRM",
  rag: "RAG",
  mls: "MLS",
  fsbo: "FSBO",
  fsbos: "FSBOs",
  cma: "CMA",
  cmas: "CMAs",
  bpo: "BPO",
  vat: "VAT",
  gst: "GST",
  ppc: "PPC",
  pdf: "PDF",
  sql: "SQL",
  csv: "CSV",
  ui: "UI",
  ux: "UX",
  hr: "HR",
  irs: "IRS",
  npc: "NPC",
  npcs: "NPCs",
  qbo: "QBO",
  sop: "SOP",
  sops: "SOPs",
  arv: "ARV",
  roi: "ROI",
  roas: "ROAS",
  sku: "SKU",
  nda: "NDA",
  bim: "BIM",
  faq: "FAQ",
  "3d": "3D",
};

const NO_DOUBLE = new Set(["w", "x", "y"]);

function inDictionary(token: string): boolean {
  const word = token.toLowerCase();
  if (!word) return true;
  if (HEADER_DICTIONARY.has(word)) return true;
  if (word.endsWith("'s") && HEADER_DICTIONARY.has(word.slice(0, -2))) return true;
  if (HEADER_BRANDS[word.replace(/[^a-z0-9]/g, "")]) return true;
  if (/^\d+(?:st|nd|rd|th)?$/.test(word)) return true;
  if (word.endsWith("s") && HEADER_DICTIONARY.has(word.slice(0, -1))) return true;
  if (word.endsWith("es") && HEADER_DICTIONARY.has(word.slice(0, -2))) return true;
  if (word.endsWith("ing")) {
    const stem = word.slice(0, -3);
    if (HEADER_DICTIONARY.has(stem) || HEADER_DICTIONARY.has(`${stem}e`)) return true;
    if (stem.length >= 3 && stem.at(-1) === stem.at(-2) && !NO_DOUBLE.has(stem.at(-1) ?? "")) {
      if (HEADER_DICTIONARY.has(stem.slice(0, -1))) return true;
    }
  }
  if (word.endsWith("ed")) {
    const stem = word.slice(0, -2);
    if (HEADER_DICTIONARY.has(stem) || HEADER_DICTIONARY.has(`${stem}e`)) return true;
  }
  return false;
}

/** Rewrite brands and the possessives a header is allowed to repair. */
export function polishHeaderPhrase(phrase: string): string {
  let next = phrase
    .replace(/\bthis weeks\b/gi, "this week's")
    .replace(/\bnext weeks\b/gi, "next week's")
    .replace(/\btodays\b/gi, "today's")
    .replace(/\btomorrows\b/gi, "tomorrow's");
  next = next.replace(/[A-Za-z0-9][A-Za-z0-9&]*/g, (token) => {
    const brand = HEADER_BRANDS[token.toLowerCase()];
    return brand ?? token;
  });
  return next.replace(/\s+/g, " ").trim();
}

/**
 * Problems in a header phrase with no "For" and no "here's how".
 * Empty means the phrase may be shown.
 */
export function headerSpellProblems(phrase: string): string[] {
  const problems: string[] = [];
  const text = phrase.replace(/\s+/g, " ").trim();
  if (/\w+ing\s+not\b/i.test(text)) problems.push("broken negation");
  if (/^[a-z]+ing\s+URLs?\b/.test(text)) problems.push("missing article");
  if (/\b(?:this|next) weeks\b/i.test(text) || /\b(?:todays|tomorrows)\b/i.test(text)) {
    problems.push("missing apostrophe");
  }
  const tokens = text.match(/[A-Za-z0-9][A-Za-z0-9'&-]*/g) ?? [];
  for (const token of tokens) {
    const parts = token.split("-").filter(Boolean);
    const pieces = parts.length > 1 ? parts : [token];
    for (const piece of pieces) {
      const key = piece.toLowerCase().replace(/[^a-z0-9]/g, "");
      const brand = HEADER_BRANDS[key];
      if (brand) {
        if (piece !== brand) problems.push(`brand casing ${piece}`);
        continue;
      }
      const bare = piece.toLowerCase().replace(/'s$/, "");
      if (!inDictionary(bare) && !inDictionary(piece.toLowerCase())) {
        problems.push(`misspelling ${piece}`);
      }
    }
  }
  return [...new Set(problems)];
}

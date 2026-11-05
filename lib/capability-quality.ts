/** Quality gates for visible capability jobs and for rendered headers and intros. */

const REPEAT_OK = new Set([
  "a", "an", "the", "to", "for", "and", "of", "in", "on", "with", "from", "into",
  "your", "you", "our", "each", "how", "can", "help", "this", "that", "they",
]);

const PRICE = /\$\s?\d|\b\d+(?:\.\d+)?\s*(?:usd|dollars?)\b|\bper\s+(?:seat|user|month|mo)\b|\blisted price\b/i;
const URL = /https?:\/\/|\bwww\./i;
const STORE = /\b(?:app store|play store|google play|download|downloads)\b/i;

export const BRAND_OK = new Set([
  "bill", "wave", "make", "pitch", "rows", "layer", "pilot", "remote", "lever",
  "build", "scale", "super", "magic", "copy", "house", "smart", "cloud", "fresh",
  "quick", "power", "light", "clear", "simple", "local", "paper", "resume",
  "slack", "excel", "video", "audio", "image", "music", "email", "photo",
  "voice", "sheet", "notes", "legal", "slide",
]);

export const CATEGORY_PHRASE: Record<string, string> = {
  bookkeeping: "bookkeeping and accounting",
  "finance-ops": "invoices and expenses",
  interior: "interior design",
  architecture: "architecture and floor plans",
  "real-estate": "real estate research",
  legal: "contract review",
  tax: "tax preparation",
  investing: "investing research",
  "personal-finance": "personal finance",
  hr: "hiring and HR",
  hiring: "hiring",
  resumes: "resumes and cover letters",
  email: "email and newsletters",
  marketing: "marketing",
  seo: "search optimization",
  ads: "ad creative",
  social: "social posts",
  content: "writing and content",
  writing: "writing",
  sales: "sales outreach",
  "customer-support": "customer support",
  "small-business": "running a small business",
  meetings: "meeting notes",
  knowledge: "company knowledge",
  scheduling: "scheduling",
  productivity: "email and scheduling",
  education: "tutoring and study",
  learning: "tutoring and study",
  "health-fitness": "fitness habits",
  research: "research",
  "search-rag": "search and research",
  "data-analysis": "spreadsheet analysis",
  spreadsheets: "spreadsheets",
  "coding-agents": "coding",
  "dev-tools": "developer tools",
  "browser-agents": "browser agents",
  "tool-use": "browser agents",
  "agent-frameworks": "agent workflows",
  "workflow-automation": "workflow automation",
  security: "security alerts",
  "it-support": "IT support",
  image: "images",
  video: "video",
  "audio-voice": "voice and audio",
  music: "music",
  "3d": "3D models",
  design: "design",
  "creative-media": "creative work",
  photography: "photo editing",
  gaming: "games",
  "game-ai": "game characters",
  translation: "translation",
  presentations: "presentations",
  ecommerce: "online stores",
  shopping: "product shopping",
  travel: "travel planning",
  construction: "construction estimates",
  mortgage: "mortgage files",
  insurance: "insurance workflows",
  nonprofit: "nonprofit fundraising",
  "general-assistants": "general questions",
};

export function categoryPhrase(categories: string[]): string {
  for (const category of categories) {
    const phrase = CATEGORY_PHRASE[category];
    if (phrase) return phrase;
  }
  return "this kind of work";
}

export function wordCount(text: string): number {
  return text.replace(/[^A-Za-z0-9$]+/g, " ").trim().split(/\s+/).filter(Boolean).length;
}

/** Header and intro backstop. Zero of these are allowed in the QA report. */
export function copyQualityProblems(text: string): string[] {
  const problems: string[] = [];
  const count = wordCount(text);
  if (count > 25) problems.push(`over 25 words (${count})`);
  if (PRICE.test(text)) problems.push("contains a price");
  if (URL.test(text)) problems.push("contains a URL");
  const tokens = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  for (let index = 0; index < tokens.length - 2; index += 1) {
    const phrase = `${tokens[index]} ${tokens[index + 1]} ${tokens[index + 2]}`;
    if (tokens.slice(index + 3).join(" ").includes(phrase)) {
      problems.push("duplicated phrase");
      break;
    }
  }
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (tokens[index] === tokens[index + 1] && tokens[index].length >= 3) {
      problems.push("duplicated phrase");
      break;
    }
  }
  return problems;
}

export function brandTokens(name: string, slug: string): string[] {
  const raw = `${name} ${slug.replace(/-/g, " ")}`.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return raw.filter((token) => token.length >= 5 && !BRAND_OK.has(token));
}

/** Build-failing rules for one visible capability job. */
export function capabilityProblems(text: string, brand: string[]): string | null {
  if (typeof text !== "string") return "not text";
  const trimmed = text.trim();
  if (trimmed.length < 12 || trimmed.length > 160) return "length";
  const words = trimmed.split(/\s+/);
  if (words.length > 14) return "too many words";
  if (PRICE.test(trimmed)) return "price";
  if (URL.test(trimmed)) return "url";
  if (STORE.test(trimmed)) return "store or download wording";
  if (!/^[a-z]/.test(trimmed)) return "must start with a lowercase verb";
  const seen = new Set<string>();
  for (const word of words) {
    const token = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!token) continue;
    if (seen.has(token) && !REPEAT_OK.has(token)) return `repeated word ${token}`;
    seen.add(token);
    if (brand.includes(token)) return "brand name inside the job";
  }
  return null;
}

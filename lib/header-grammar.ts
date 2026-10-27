/**
 * Header grammar shared by search rendering and the build gate.
 * A header fails when an article, filler, or verb-noun pair is ungrammatical.
 */

const MASS = new Set([
  "land",
  "acreage",
  "zoning",
  "analysis",
  "triage",
  "learning",
  "research",
  "equipment",
  "software",
  "traffic",
  "feedback",
  "advice",
  "information",
  "housing",
  "marketing",
]);

const SAFE_HELP = /^(?:your small business|quickbooks|qbo|freshbooks|xero|zoho books|wave|invoices|bookkeeping|the books|local seo|customer follow-up)$/i;

const SKIP_IN_NOUN = new Set([
  "in", "for", "on", "from", "near", "by", "to", "of", "the", "your", "my", "our", "this", "that", "per", "with",
]);

const PREPOSITION = new Set([
  "in", "into", "for", "on", "from", "near", "by", "to", "of", "with", "about", "before", "after",
  "during", "over", "under", "without", "within", "at", "as",
]);

function bare(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function isPlural(word: string): boolean {
  if (word.length < 4) return false;
  if (/(?:ss|is|us|ics|ness)$/.test(word)) return false;
  if (/ing$/.test(word)) return false;
  if (["this", "plus", "business", "analysis", "series", "canvas", "status", "news"].includes(word)) return false;
  return /(?:s|es)$/.test(word);
}

export function safeHelpWith(phrase: string): boolean {
  return SAFE_HELP.test(phrase.replace(/^help with\s+/i, "").trim());
}

function nounPhrase(chunk: string): string[] {
  const words = chunk.split(/\s+/).map(bare).filter((word) => word && !SKIP_IN_NOUN.has(word) && word !== "and" && word !== "or");
  const content: string[] = [];
  for (const word of words) {
    if (content.length > 0 && PREPOSITION.has(word) && word !== "by") break;
    if (PREPOSITION.has(word) && word !== "by" && word !== "for") continue;
    content.push(word);
  }
  return content;
}

function articleIssues(phrase: string): string[] {
  const problems: string[] = [];
  const re = /\b(a|an)\s+((?:[\w'-]+\s+){0,10}[\w'-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(phrase))) {
    const chunk = (match[2].split(/\s+\b(?:with|and|or)\b\s+/i)[0] ?? match[2]).toLowerCase();
    const content = nounPhrase(chunk);
    const head = content[content.length - 1] ?? "";
    if (!head) continue;
    if (MASS.has(head) || ["land", "acreage", "analysis", "triage", "learning"].includes(head)) {
      problems.push("a before a mass noun");
    }
    if (isPlural(head)) problems.push("a before a plural noun");
    if (head === "arv" || head === "fsbo" || /\ban arv\b/i.test(phrase)) problems.push("a before an acronym");
  }
  if (/\ban arv\b/i.test(phrase)) problems.push("a before an acronym");
  return problems;
}

/**
 * Problems in a header phrase (no "For" and no trailing "here's how").
 * Empty means the phrase can be shown.
 */
export function headerEchoProblems(phrase: string): string[] {
  const problems: string[] = [];
  const lower = phrase.toLowerCase().replace(/\s+/g, " ").trim();
  if (/\bfor your agent\b/.test(lower) || /\bfor an agent\b/.test(lower)) problems.push("for your agent");
  if (/\bposting social media\b/.test(lower)) problems.push("posting social media");
  if (/\bfor (?:my|your|our|the) business\b/.test(lower)) problems.push("business filler");
  if (/\b(?:pulling|reviewing)\s+requests?\b/.test(lower)) problems.push("unknown verb noun");
  if (/\btexting to\b/.test(lower)) problems.push("unknown verb noun");
  if (/\bpricing comparison\b/.test(lower)) problems.push("unknown verb noun");
  if (/\bdrafting reply\b/.test(lower)) problems.push("unknown verb noun");
  if (/^help with\s+(?:a|an)\b/.test(lower) && /\b(review|assistant|master|business|talking-head|cap rate|promotion|store|triage|analysis|learning|land)\b/.test(lower)) {
    problems.push("bare singular after a");
  }
  problems.push(...articleIssues(lower));
  return [...new Set(problems)];
}

/** True when this phrase should not be used as a header. */
export function headerEchoBroken(phrase: string): boolean {
  return headerEchoProblems(phrase).length > 0;
}

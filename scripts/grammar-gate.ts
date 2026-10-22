import nlp from "compromise";

type Term = { text: string; tags: string[] };

const ACRONYM = /\b(seo|fsbo|npcs|npc|rag|soc|crm|gmail)\b|\bq&a\b/;

/** Strings from the CEO review. The gate must flag each one. */
export const BROKEN_HEADERS = [
  "finding your motivated sellers",
  "finding your fsbo near me",
  "finding your vacant lot in texas",
  "finding your acreage in florida",
  "finding your zoning for this parcel",
  "finding your rental properties",
  "handling your center for order status",
  "supporting tickets",
  "managing your triage your gmail",
  "scheduling your calendar management",
  "scheduling your reminders for next week",
  "creating your seo",
  "screening your resume review",
  "screening your hiring",
  "shopping your price comparison",
  "shopping your product recommendations",
  "processing your accounts payable",
  "answering your knowledge base",
  "answering your enterprise search",
  "answering your policy lookup",
  "answering from our wiki",
  "answering your document q&a",
  "answering your wiki",
  "monitoring your phishing report",
  "monitoring your threat hunting",
  "monitoring your soc alert",
  "monitoring your phishing",
  "tutoring your study plan",
  "tutoring your practice problems",
  "tutoring your homework",
  "tutoring me",
  "tutoring",
  "turning your sizzle reel",
  "turning your highlight reel",
  "writing your pull request",
  "writing your coding agent",
  "automating your workflow automation",
  "automating your fill forms",
  "automating your computer use",
  "automating your something for workflow automation",
  "splitting your multi-agent crew",
  "splitting your agent crew",
  "splitting your multi-agent workflow",
  "researching your vector database",
  "researching your rag",
  "researching",
  "shopping",
  "turning your action items from the transcript",
  "adding your npc dialogue",
  "adding your npcs dialogue",
  "working on fix your car",
  "working on paint the bedroom",
  "working on start a book club",
  "working on learn piano",
  "working on pack for a move",
  "working on name a baby",
  "working on grocery list",
  "working on water the garden",
  "working on fold the laundry",
  "working on meal prep for the week",
  "working on custmer support",
  "working on litrature review",
  "working on real estate",
];

export const BROKEN_ASSISTANT = [
  "compare your cake",
  "compare your fold laundry",
  "draft an email about your from our wiki",
  "compare your who can youtube short",
  "turn your npcs into a checklist",
  "turn transcribe your meeting into a checklist",
  "lay your start club out as a calendar plan",
  "sourced summary of your crew",
  "sourced summary of your acreage florida",
  "compare your function",
  "draft an email about your homework",
  "turn your homes for sale owner into a checklist",
  "compare your cold email in a side-by-side table",
];

function termsOf(text: string): Term[] {
  const sentences = nlp(text).json() as Array<{ terms?: Term[] }>;
  return sentences.flatMap((sentence) => sentence.terms ?? []);
}

function tags(term: Term | undefined): string[] {
  return term?.tags ?? [];
}

function isVerb(term: Term | undefined): boolean {
  const list = tags(term);
  return list.includes("Verb") || list.includes("Gerund");
}

function headerPhrase(text: string): string {
  return text.replace(/^For\s+/i, "").replace(/,?\s*here'?s how each tool can help:\s*$/i, "").trim();
}

function yourFollowedByVerb(text: string): boolean {
  const terms = termsOf(text);
  for (let index = 0; index < terms.length - 1; index++) {
    if (!/^your$/i.test(terms[index].text)) continue;
    const next = terms[index + 1];
    if (isVerb(next) || tags(next).includes("Gerund")) return true;
    if (tags(next).includes("Determiner")) return true;
  }
  return /\byour\s+(?:a|an|the)\b/i.test(text);
}

function twoVerbsAtStart(phrase: string): boolean {
  if (/^working on\b/i.test(phrase)) return true;
  const terms = termsOf(phrase);
  if (terms.length < 2 || !isVerb(terms[0])) return false;
  const bridge = terms[1].text.toLowerCase();
  if (/^(?:on|to)$/.test(bridge)) {
    const next = terms[2];
    return Boolean(next && (isVerb(next) || /^[a-z]+$/.test(next.text)) && !tags(next).includes("Determiner"));
  }
  const second = terms[1];
  if (!isVerb(second) || tags(second).includes("Noun") || tags(second).includes("Adjective")) return false;
  return tags(second).includes("Infinitive") || tags(second).includes("Imperative");
}

export function headerUsesBrokenPhrase(phrase: string): string | null {
  const normalized = phrase.toLowerCase().trim();
  for (const item of BROKEN_HEADERS) {
    if (normalized === item) return item;
    if (item.includes(" ") && (normalized.startsWith(`${item} `) || normalized.startsWith(`${item},`))) return item;
  }
  return null;
}

function brokenHeaderHit(text: string): boolean {
  return headerUsesBrokenPhrase(headerPhrase(text)) !== null;
}

function bareGerund(phrase: string): boolean {
  return /^(?:for\s+)?[a-z]+ing(?:\s+(?:me|you|us|them))?$/i.test(phrase.trim());
}

/**
 * Build-time grammar check for a rendered header, intro, or why-line.
 * Returns short problem labels. Empty means the line passed.
 */
export function grammarProblems(text: string, kind: "header" | "intro" | "why" = "why"): string[] {
  const problems: string[] = [];
  const lower = text.toLowerCase();
  const phrase = kind === "header" ? headerPhrase(text) : text;
  if (kind === "header" && brokenHeaderHit(text)) problems.push("broken header example");
  if (BROKEN_ASSISTANT.some((item) => lower.includes(item))) problems.push("broken assistant example");
  if (yourFollowedByVerb(text)) problems.push("your followed by a verb or determiner");
  if (/\byour\s+your\b/i.test(text)) problems.push("doubled your");
  if (/\byour\s+(?:in|into|from|for|about|on)\b/i.test(text)) problems.push("empty noun after your");
  if (/\babout your\s*(?:[.,]|$)/i.test(text)) problems.push("empty noun after about your");
  if (twoVerbsAtStart(phrase)) problems.push("two verbs at the start");
  if (kind === "header") {
    if (!/^(?:help with\b|(?:[a-z]+-)?[a-z]+ing\b)/i.test(phrase)) problems.push("header does not start with a gerund or help with");
    if (bareGerund(phrase)) problems.push("header is only a gerund");
    if (/\bworking on\b/i.test(phrase)) problems.push("working on header");
    if (/\bour\b/i.test(phrase)) problems.push("header still says our");
  }
  if (ACRONYM.test(text)) problems.push("lowercase acronym");
  if (/\bside-by-side\b/i.test(text)) problems.push("side-by-side slot");
  if (/\bsourced summary\b/i.test(text)) problems.push("sourced summary slot");
  if (/\binto a checklist\b/i.test(text)) problems.push("checklist slot");
  if (/\bcalendar plan\b/i.test(text)) problems.push("calendar plan slot");
  if (/\bdraft an email about your\b/i.test(text)) problems.push("email-about slot");
  if (/\bso you can\s+(?:start|keep|finish)\s+\w+ing\b/i.test(text)) problems.push("robotic gerund ending");
  return problems;
}

/** Internal process notes that must not appear on a card or a tool description. */
export const DESCRIPTION_BANNED =
  /\bno monthly price (?:confirmed|was listed|listed)\b|\bpricing page (?:included|showed|loaded)\b|\b(?:on the |the )?pages? we read\b|\bwe (?:read|checked|fetched)\b|\bnot installed here\b|\bnot hands-on(?: tested)?\b|\bunconfirmed\b|\bnot clearly confirmed\b|\bdid not come through\b|\bfree-to-start option\b|\bwe imported\b/i;

export function descriptionProblems(text: string): string[] {
  return DESCRIPTION_BANNED.test(text) ? ["description uses internal wording"] : [];
}

/** Research-process phrasing that must not appear in any text rendered on a tool page. */
export const TOOL_PAGE_RESEARCH =
  /\bwe (?:read|fetched|imported|checked|crawled|extracted|opened|found|recorded|could|parsed|ran|logged)\b|\bwe do not\b|\bpages? we\b|\bour (?:checker|client|check|crawl)\b|\bthis (?:check|listing|environment|pass)\b|\bfetched\b|\bthe fetch\b|\bin the fetch\b|\bthat fetch\b|\bpricing crawl\b|\bnot installed here\b|\blocally\b|\bunconfirmed\b|\bnot confirmed\b|\bcould not verify\b|\bthis listing\b|\bour crawl\b|\bStatus\s+\d{3}\b|\bHTTP\b|\bsmoke test\b|\blocal install\b|→|\bpip\b|\bimport\b|==|;|\bLLM invoke\b|\bmodel call\b|\bpackage\b|\b\d{4}-\d{2}-\d{2}\b|\bsample|\bon the page\b|\bnot listed here\b|\bcame back\b|\bredirected\b|\bre-read\b|\banimated\b|\bJSON\b|\bwithout JavaScript\b|—/i;

export function toolPageCopyProblems(text: string): string[] {
  return TOOL_PAGE_RESEARCH.test(text) ? ["tool page uses internal wording"] : [];
}

const SPECIALIST_BANNED =
  /\bis for\b|\bwe imported\b|\blocally\b|\bpriced on the site\b|\bpricing page\b|\bso you can\b|\bdifferent job\b|\bnot a\b|\binstead of\b/i;

/** Best for / Not ideal for bullets on a tool page. */
export function toolPageBulletProblems(text: string): string[] {
  return SPECIALIST_BANNED.test(text) ? ["tool page bullet uses banned wording"] : [];
}

/** Specialist why-lines must be "<Name> <verb> ...", with no template glue. */
export function specialistWhyProblems(name: string, why: string): string[] {
  const problems: string[] = [];
  if (SPECIALIST_BANNED.test(why)) problems.push("specialist why has banned wording");
  if (!why.startsWith(`${name} `)) {
    problems.push("specialist why does not start with the tool name");
    return problems;
  }
  const next = why.slice(name.length).trim().match(/^[A-Za-z]+/)?.[0] ?? "";
  const sentence = nlp(next).json() as Array<{ terms?: Term[] }>;
  const tags = sentence[0]?.terms?.[0]?.tags ?? [];
  // Compromise tags the verb "tutors" as a noun ("Khanmigo tutors a student").
  const verb = next.toLowerCase() === "tutors"
    || tags.includes("Verb")
    || tags.includes("PresentTense")
    || tags.includes("Infinitive");
  if (!verb) problems.push(`specialist why does not follow the name with a verb (${next || "missing"})`);
  return problems;
}

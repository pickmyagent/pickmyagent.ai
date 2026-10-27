import { DOMAIN_TAILS } from "./assistant-domain.ts";

/** Hand-written fallback lines. One concrete task per assistant, per use case. */

export const ASSISTANT_SLUGS = ["claude", "chatgpt", "gemini", "perplexity", "deepseek"] as const;

const NAMES: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  perplexity: "Perplexity",
  deepseek: "DeepSeek",
};

function lines(tails: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    ASSISTANT_SLUGS.map((slug) => [slug, `Ask ${NAMES[slug]} ${tails[slug]}`]),
  );
}

export const DOMAIN_LINES: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(DOMAIN_TAILS).map(([slug, tails]) => [slug, lines(tails)]),
);

export function domainAssistantLine(slug: string, useCaseSlug: string): string | null {
  return DOMAIN_LINES[useCaseSlug]?.[slug] ?? null;
}

/** No-domain frames. The slot is the full cleaned gerund, or the object after "help with". */
const FRAME_LINES: Array<{ test: RegExp; lines: Record<string, string> }> = [
  {
    test: /meal prep/i,
    lines: lines({
      claude: "to plan a week of meals from what you already have, and list the prep steps.",
      chatgpt: "for a grocery list grouped by the meals you will cook this week.",
      gemini: "to build a sheet of meals, ingredients, and which day you prep them.",
      perplexity: "for sourced prep times and storage notes for the meals you chose, with links you can check.",
      deepseek: "to shrink a week of meals so the ingredients overlap and you cook less.",
    }),
  },
  {
    test: /grocery list/i,
    lines: lines({
      claude: "to group a grocery list by store section and mark what you might already have.",
      chatgpt: "for a checklist of groceries split into produce, cold, and pantry.",
      gemini: "to build a sheet of items, the aisle, and whether you still need to buy them.",
      perplexity: "for sourced swaps when an item on the grocery list is out, with links you can check.",
      deepseek: "to cut a grocery list down to what the meals actually require.",
    }),
  },
  {
    test: /(?:naming a baby|baby names?)/i,
    lines: lines({
      claude: "to suggest baby names that fit the style you describe and say what each one means.",
      chatgpt: "for a short list of baby names with the meaning next to each one.",
      gemini: "to build a sheet of baby names, meanings, and the ones you want to keep.",
      perplexity: "for sourced notes on a baby name's origin, with links you can check.",
      deepseek: "to compare two baby names and list what you still want to decide.",
    }),
  },
  {
    test: /book club/i,
    lines: lines({
      claude: "to suggest the next book and draft questions the club can discuss.",
      chatgpt: "for a checklist for the next book club meeting, including the book and who hosts.",
      gemini: "to build a sheet of books, meeting dates, and discussion questions.",
      perplexity: "for sourced reading notes on the club's next book, with links you can check.",
      deepseek: "to turn a book into five discussion questions the club can edit.",
    }),
  },
  {
    test: /alternative/i,
    lines: lines({
      claude: "to compare tools that do this job and name what you would give up by switching.",
      chatgpt: "for a checklist of the job you still need and which other tools cover it.",
      gemini: "to build a sheet of tools, the job each one does, and the one you want to try.",
      perplexity: "for sourced pages on tools that do this job, with links you can check.",
      deepseek: "to list what you use the tool for and which part another tool would still miss.",
    }),
  },
  {
    test: /small business/i,
    lines: lines({
      claude: "to draft a customer reply and a short list of bookkeeping you still check.",
      chatgpt: "for a weekly checklist of posts, invoices, and customer replies for a small business.",
      gemini: "to build a sheet of customers, the next reply, and the bookkeeping item still open.",
      perplexity: "for sourced checklists for a small-business week, with links you can check.",
      deepseek: "to outline one customer reply, one post, and the bookkeeping step you still do yourself.",
    }),
  },
];

/** Used when the query is not a grammatical verb phrase, so the line does not splice it. */
export function neutralAssistantLine(slug: string, name: string): string {
  if (slug === "claude") return `Ask ${name} to turn this into a short plan you can edit.`;
  if (slug === "chatgpt") return `Ask ${name} to list the steps and leave the decisions to you.`;
  if (slug === "gemini") return `Ask ${name} to lay the steps out so you can check them.`;
  if (slug === "perplexity") return `Ask ${name} for sourced notes, and you keep the links.`;
  if (slug === "deepseek") return `Ask ${name} to outline one next step and mark what you still decide.`;
  return `Ask ${name} to outline a next step you can edit.`;
}

export function openAssistantLine(slug: string, name: string, slot: string): string {
  const task = slot.trim();
  for (const frame of FRAME_LINES) {
    if (frame.test.test(task) && frame.lines[slug]) return frame.lines[slug];
  }
  if (slug === "claude") return `Ask ${name} to break ${task} into a step-by-step plan.`;
  if (slug === "chatgpt") return `Ask ${name} for a checklist for ${task}.`;
  if (slug === "gemini") return `Ask ${name} to build a shared doc or sheet to track ${task}.`;
  if (slug === "perplexity") return `Ask ${name} for sourced tips on ${task} with links you can check.`;
  if (slug === "deepseek") return `Ask ${name} to outline tradeoffs and a next step for ${task}.`;
  return `Ask ${name} to outline a next step for ${task}.`;
}

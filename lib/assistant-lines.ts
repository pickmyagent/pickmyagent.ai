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

export const DOMAIN_LINES: Record<string, Record<string, string>> = {
  "find-off-market": lines({
    claude: "to turn for-sale-by-owner outreach into steps you can check before contacting an owner.",
    chatgpt: "for a checklist of what to verify on an off-market listing before you reach out.",
    gemini: "to build a sheet that tracks each owner, the property, and whether you already made contact.",
    perplexity: "for public pages about for-sale-by-owner records, with links you can check.",
    deepseek: "to reason through which owner details are still missing before you send a note.",
  }),
  "find-land": lines({
    claude: "to turn zoning and parcel questions into steps before you pursue a land deal.",
    chatgpt: "for a list of facts to confirm on a parcel, including access and zoning.",
    gemini: "to build a sheet that tracks acreage, zoning, and which parcels you have already screened.",
    perplexity: "for sourced pages on zoning and parcel records, with links you can check.",
    deepseek: "to lay out what a land listing still does not prove, and what to verify next.",
  }),
  "rank-property-deals": lines({
    claude: "to break a real estate deal into numbers you can compare before you rank it.",
    chatgpt: "for a checklist of rental or flip figures to gather before you sort deals.",
    gemini: "to build a sheet that lines up price, rent, and rehab so you can rank deals.",
    perplexity: "for sourced explanations of cash-flow terms, with links you can check.",
    deepseek: "to compare two deal writeups and say which figures are still missing.",
  }),
  "manage-portfolio": lines({
    claude: "to separate the accounts in an investment portfolio and list fee questions worth asking.",
    chatgpt: "for a holdings checklist you can fill in before comparing allocation.",
    gemini: "to build a sheet with one row per account and a column for annual cost.",
    perplexity: "for linked explanations of index funds versus active funds you can read yourself.",
    deepseek: "to spell out risk questions to ask before moving money between accounts.",
  }),
  "do-taxes": lines({
    claude: "to sort income and possible deductions into questions for a tax pro.",
    chatgpt: "for a checklist of forms and receipts to gather before you file.",
    gemini: "to build a sheet that tracks documents you still need for a tax return.",
    perplexity: "for sourced pages about common deductions, with links you can check before you file.",
    deepseek: "to draft questions about credits and deductions for a tax pro to answer.",
  }),
  "customer-support": lines({
    claude: "to turn a support ticket about a refund or an order into a reply a person still approves.",
    chatgpt: "for a checklist of order facts to confirm before answering a customer.",
    gemini: "to build a sheet that tracks ticket status, the order, and who replies next.",
    perplexity: "for sourced help-center pages about refunds and shipping, with links you can check.",
    deepseek: "to draft a calm reply that states what is known and what a person must still decide.",
  }),
  "sales-outreach": lines({
    claude: "to outline how to research a lead and which outreach sentence you would actually send.",
    chatgpt: "for a qualification checklist before you add a prospect to a pipeline.",
    gemini: "to build a sheet of leads, last contact, and the next outreach step.",
    perplexity: "for sourced background on a company you might email, with links you can check.",
    deepseek: "to rewrite a cold email so the ask is specific and you still choose what gets sent.",
  }),
  "manage-inbox": lines({
    claude: "to group an email inbox into threads that need a reply and threads to archive.",
    chatgpt: "for a checklist for clearing an inbox without missing a direct question.",
    gemini: "to build a sheet of senders, subjects, and whether a reply is still owed.",
    perplexity: "for sourced tips on inbox triage habits, with links you can check.",
    deepseek: "to draft a short reply to one thread and list what you should not promise.",
  }),
  "scheduling-assistant": lines({
    claude: "to propose meeting times and a prep list from a messy calendar description.",
    chatgpt: "for a weekly checklist of meetings, reminders, and follow-ups.",
    gemini: "to build a sheet for next week's reminders and meetings.",
    perplexity: "for sourced tips on scheduling across time zones, with links you can check.",
    deepseek: "to turn a pile of constraints into two or three times you could offer.",
  }),
  "create-content": lines({
    claude: "to outline a blog or marketing page and mark the sentences you should rewrite.",
    chatgpt: "for a checklist of headings, examples, and claims to verify in a draft.",
    gemini: "to build a doc that tracks draft status, the target reader, and open questions.",
    perplexity: "for sourced pages you can cite while drafting, with links you can check.",
    deepseek: "to revise a paragraph so the claim is narrower and easier to check.",
  }),
  "analyze-data": lines({
    claude: "to explain what spreadsheet columns show and which total you should recompute.",
    chatgpt: "for a checklist of filters, totals, and charts to build from a table.",
    gemini: "to build a sheet layout for a report, with one tab for the source numbers.",
    perplexity: "for sourced definitions of the metrics in a report, with links you can check.",
    deepseek: "to list which figures in a table do not support the conclusion someone wrote.",
  }),
  "hire-candidates": lines({
    claude: "to screen a resume against a role and list gaps a person should confirm.",
    chatgpt: "for an interview checklist and the outreach points you might send a candidate.",
    gemini: "to build a sheet of applicants, stage, and the next scheduling step.",
    perplexity: "for sourced background on a skill you are hiring for, with links you can check.",
    deepseek: "to draft candidate outreach that a recruiter can edit before it is sent.",
  }),
  "plan-travel": lines({
    claude: "to draft an itinerary with flights, hotels, and the decisions you still book yourself.",
    chatgpt: "for a packing and booking checklist for a trip.",
    gemini: "to build a sheet of flight options, hotels, and dates in separate columns.",
    perplexity: "for sourced pages on neighborhoods and transit, with links you can check.",
    deepseek: "to compare two hotel descriptions and say what is still unconfirmed.",
  }),
  "shop-products": lines({
    claude: "to compare product differences and leave the final purchase to you.",
    chatgpt: "for a buying checklist of must-have specs and prices to verify.",
    gemini: "to build a sheet of models, prices, and the source link for each.",
    perplexity: "for sourced reviews and spec pages, with links you can check before you buy.",
    deepseek: "to narrow a product list to three options and name the spec that separates them.",
  }),
  "finance-ops": lines({
    claude: "to pull invoice fields into a list and flag lines that do not match a purchase order.",
    chatgpt: "for an accounts-payable checklist before someone approves a payment.",
    gemini: "to build a sheet of invoice number, amount, and exception status.",
    perplexity: "for sourced explainers of purchase-order matching, with links you can check.",
    deepseek: "to state which invoice lines a person should reject or question.",
  }),
  "knowledge-qa": lines({
    claude: "to answer a policy question and name the wiki page a teammate should open.",
    chatgpt: "for a checklist of what an internal answer must cite before you trust it.",
    gemini: "to build a doc that collects the policy excerpts people keep asking about.",
    perplexity: "for public sources when the company wiki does not cover a term, with links you can check.",
    deepseek: "to draft an answer that quotes only the document text you paste in.",
  }),
  "social-media": lines({
    claude: "to draft a social post and a reply to a comment, both for you to send.",
    chatgpt: "for a posting checklist with the claim, the asset, and the date.",
    gemini: "to build a sheet that lays out posts across the month.",
    perplexity: "for sourced notes on a topic you might post about, with links you can check.",
    deepseek: "to rewrite a caption so it makes one point and does not invent a statistic.",
  }),
  "it-helpdesk": lines({
    claude: "to triage an IT help desk ticket and write the password-reset steps a person still runs.",
    chatgpt: "for a checklist that separates a password reset from a ticket that needs an admin.",
    gemini: "to build a sheet of tickets, the owner, and the next handoff.",
    perplexity: "for sourced vendor docs about a common IT error, with links you can check.",
    deepseek: "to draft a help desk reply that says what was tried and what is still blocked.",
  }),
  "security-ops": lines({
    claude: "to summarize a phishing report and list what a person should verify before anyone clicks.",
    chatgpt: "for a triage checklist for a security alert.",
    gemini: "to build a sheet of alerts, severity, and the evidence still missing.",
    perplexity: "for sourced writeups of a threat name, with links you can check.",
    deepseek: "to say whether a pasted email header is enough to call something phishing.",
  }),
  "deep-research": lines({
    claude: "to outline a literature review and mark which claims need a source.",
    chatgpt: "for a research checklist of questions, papers, and open disagreements.",
    gemini: "to build a sheet of sources, dates, and the finding you took from each.",
    perplexity: "for linked papers and pages on the question, so you can read them yourself.",
    deepseek: "to compare two summaries and list claims that still have no citation.",
  }),
  tutoring: lines({
    claude: "to explain one concept and then write practice problems that test only that idea.",
    chatgpt: "for a study checklist with what to review and which problems to retry.",
    gemini: "to build a sheet that tracks which practice problems you still miss.",
    perplexity: "for sourced lessons on the topic, with links you can check.",
    deepseek: "to show a worked example and then a similar problem with the answer withheld.",
  }),
  "game-creative": lines({
    claude: "to outline short-clip moments from a long video and draft captions you can edit.",
    chatgpt: "for a checklist of clip length, caption, and the shot you still need.",
    gemini: "to build a sheet of timecodes, captions, and which clip is ready.",
    perplexity: "for sourced notes on framing and captions for short video, with links you can check.",
    deepseek: "to turn a scene description into a shot list with camera moves you can film or generate.",
  }),
  "coding-agents": lines({
    claude: "to read a bug report and suggest a code edit plus a review note you can reject.",
    chatgpt: "for a debugging checklist before you change a repo.",
    gemini: "to build a doc that tracks the failing test, the hypothesis, and the diff.",
    perplexity: "for sourced docs on the error or library, with links you can check.",
    deepseek: "to fill in a function from the code before and after the gap, then explain the edit.",
  }),
  "workflow-automation": lines({
    claude: "to map a repeated task into steps you approve before any app runs them.",
    chatgpt: "for a checklist of triggers, apps, and the step that must stay manual.",
    gemini: "to build a sheet of workflow steps, the app each one touches, and who approves it.",
    perplexity: "for sourced docs on the apps a workflow would connect, with links you can check.",
    deepseek: "to point out which step in an automation description is still vague.",
  }),
  "multi-agent-workflows": lines({
    claude: "to split one job into steps and say which step a second agent could draft.",
    chatgpt: "for a handoff checklist so each agent has one output you can approve.",
    gemini: "to build a sheet of steps, the agent assigned, and whether you accepted the result.",
    perplexity: "for sourced pages on multi-agent patterns, with links you can check.",
    deepseek: "to rewrite a crew plan so you still approve anything that gets sent.",
  }),
  "research-rag": lines({
    claude: "to outline a RAG pipeline from source pages to a short answer you can trace.",
    chatgpt: "for a checklist of crawl, chunk, retrieve, and the citation you expect back.",
    gemini: "to build a sheet of source URLs, the passage used, and the answer it supports.",
    perplexity: "for sourced intros to vector search, with links you can check.",
    deepseek: "to say which part of a retrieval answer is not backed by the passages you paste in.",
  }),
  "meetings-knowledge": lines({
    claude: "to turn meeting notes into decisions and action items you can edit.",
    chatgpt: "for a checklist that separates decisions, owners, and due dates.",
    gemini: "to build a doc of action items with owner and date columns.",
    perplexity: "for sourced tips on meeting notes, with links you can check.",
    deepseek: "to extract tasks from a transcript and drop anything that was only an aside.",
  }),
  "tool-use-browser": lines({
    claude: "to write browser steps for a repeated web task and mark where a login should stop you.",
    chatgpt: "for a checklist of form fields and the step that needs a person.",
    gemini: "to build a sheet of page, field, and the value a browser step may enter.",
    perplexity: "for sourced docs on browser automation limits, with links you can check.",
    deepseek: "to review a click-path and name the step that should stop at a captcha.",
  }),
  "game-npcs": lines({
    claude: "to draft dialogue for an in-game character, and you decide which lines are allowed.",
    chatgpt: "for a checklist of character voice, forbidden topics, and sample lines.",
    gemini: "to build a sheet of NPC lines, the trigger, and whether the game may say them.",
    perplexity: "for sourced notes on dialogue design, with links you can check.",
    deepseek: "to rewrite a character line so it stays in the voice you described.",
  }),
};

/** One natural infinitive ending per card. Tax endings stay the four the tests require. */
export const SPECIALIST_ENDINGS: Record<string, string[]> = {
  "find-off-market": [
    "compare for-sale-by-owner listings",
    "draft a note to an owner",
    "decide which owner to contact",
    "review a listing before outreach",
  ],
  "find-land": [
    "screen a parcel before you offer",
    "check zoning on a parcel",
    "compare acreage you might buy",
    "track land worth a second look",
  ],
  "rank-property-deals": [
    "rank the deals yourself",
    "compare rental cash flow",
    "sort houses you might flip",
    "review a deal before you bid",
  ],
  "manage-portfolio": [
    "line up the accounts",
    "compare fees and risk",
    "draft questions before you rebalance",
    "review the allocation",
  ],
  "do-taxes": [
    "file your taxes",
    "get your taxes done",
    "finish your taxes",
    "complete your taxes",
  ],
  "customer-support": [
    "reply to the ticket",
    "check an order status",
    "draft a refund answer",
    "mark what a person still handles",
  ],
  "sales-outreach": [
    "draft outreach you choose to send",
    "qualify a lead",
    "update a pipeline note",
    "research a prospect",
  ],
  "manage-inbox": [
    "triage the inbox",
    "summarize a thread",
    "draft a reply",
    "decide what to archive",
  ],
  "scheduling-assistant": [
    "propose meeting times",
    "plan the week",
    "draft a follow-up",
    "set the reminders",
  ],
  "create-content": [
    "outline a post",
    "draft copy you can edit",
    "list the headings",
    "revise a draft",
  ],
  "analyze-data": [
    "summarize the columns",
    "draft a report from the table",
    "check the numbers against the sheet",
    "explain what the data shows",
  ],
  "hire-candidates": [
    "screen a resume",
    "draft candidate outreach",
    "line up interview notes",
    "compare applicants",
  ],
  "plan-travel": [
    "draft an itinerary",
    "compare flights and hotels",
    "plan the trip",
    "list what you still book yourself",
  ],
  "shop-products": [
    "compare the products",
    "summarize the differences",
    "make a short list to buy from",
    "check prices you can verify",
  ],
  "finance-ops": [
    "read an invoice",
    "match a purchase order",
    "flag an expense",
    "pull out the invoice fields",
  ],
  "knowledge-qa": [
    "answer from the company wiki",
    "cite the document to check",
    "look up a policy",
    "draft an answer a person can verify",
  ],
  "social-media": [
    "draft a post",
    "put a post on a schedule",
    "draft a reply to a comment",
    "plan the content calendar",
  ],
  "it-helpdesk": [
    "triage a help desk ticket",
    "draft a password-reset step",
    "route what a person still does",
    "answer a common IT question",
  ],
  "security-ops": [
    "summarize a security alert",
    "review a phishing report",
    "list what to verify before anyone acts",
    "triage the alert",
  ],
  "deep-research": [
    "open the sources",
    "summarize the papers",
    "draft a brief you can check",
    "compare what the sources say",
  ],
  tutoring: [
    "explain a concept",
    "draft practice problems",
    "track which problems you miss",
    "build a study plan",
  ],
  "game-creative": [
    "find moments in a long video",
    "draft captions for a clip",
    "outline a short clip",
    "compare which moments to cut",
  ],
  "coding-agents": [
    "suggest a code edit",
    "draft a review note",
    "read the repo",
    "check the change before it ships",
  ],
  "workflow-automation": [
    "map a repeated workflow",
    "list the steps you approve",
    "connect the apps a workflow touches",
    "turn a checklist into steps",
  ],
  "multi-agent-workflows": [
    "split a job into steps",
    "hand a step to another agent",
    "approve what gets sent",
    "outline who does which step",
  ],
  "research-rag": [
    "open the source pages",
    "compare what the pages say",
    "draft a short brief",
    "check the links yourself",
  ],
  "meetings-knowledge": [
    "turn notes into action items",
    "list the decisions",
    "edit the task list",
    "pull tasks from a transcript",
  ],
  "tool-use-browser": [
    "write the browser steps",
    "stop at a login or captcha",
    "repeat a web task you direct",
    "fill a form you approve",
  ],
  "game-npcs": [
    "draft what a character says",
    "keep only lines the game allows",
    "outline a conversation",
    "write dialogue you can edit",
  ],
};

export function domainAssistantLine(slug: string, useCaseSlug: string): string | null {
  return DOMAIN_LINES[useCaseSlug]?.[slug] ?? null;
}

/** No-domain frames. The slot is the full cleaned gerund, or the object after "help with". */
export function openAssistantLine(slug: string, name: string, slot: string): string {
  const task = slot.trim();
  if (slug === "claude") return `Ask ${name} to break ${task} into a step-by-step plan.`;
  if (slug === "chatgpt") return `Ask ${name} for a checklist for ${task}.`;
  if (slug === "gemini") return `Ask ${name} to build a shared doc or sheet to track ${task}.`;
  if (slug === "perplexity") return `Ask ${name} for sourced tips on ${task} with links you can check.`;
  if (slug === "deepseek") return `Ask ${name} to outline tradeoffs and a next step for ${task}.`;
  return `Ask ${name} to outline a next step for ${task}.`;
}

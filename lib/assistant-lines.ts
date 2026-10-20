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
    deepseek: "to pick which moments in a long video are worth cutting into a short clip.",
  }),
  "video-generation": lines({
    claude: "to outline a shot list, name the camera move, and draft the prompt you paste into a video app.",
    chatgpt: "for a checklist of shot, camera move, and the prompt you still write.",
    gemini: "to build a sheet of shots, camera moves, and the prompt for each one.",
    perplexity: "for sourced notes on camera moves and prompting for AI video, with links you can check.",
    deepseek: "to turn a scene into a shot list with camera moves and a prompt you can edit.",
  }),
  "voice-audio": lines({
    claude: "to draft the script and describe the voice you want before you generate the audio.",
    chatgpt: "for a checklist of script, voice, and the take you still record or generate.",
    gemini: "to build a sheet of lines, the voice, and whether the take is approved.",
    perplexity: "for sourced notes on voice generation, with links you can check.",
    deepseek: "to rewrite a script so the line is short enough to read aloud.",
  }),
  "write-resume": lines({
    claude: "to draft resume bullets from the job you did and the role you are applying for.",
    chatgpt: "for a checklist of experience, skills, and the job description you are matching.",
    gemini: "to build a sheet of roles, bullets, and the keywords from the posting.",
    perplexity: "for sourced examples of resume structure, with links you can check.",
    deepseek: "to rewrite a bullet so it names the work and the result, and you keep the facts.",
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
  "make-images": lines({
    claude: "to describe the image you want and list what to change after you generate it.",
    chatgpt: "for a checklist of subject, style, and the detail you still want in the picture.",
    gemini: "to build a sheet of image prompts, the result, and what you would change.",
    perplexity: "for sourced notes on prompting for images, with links you can check.",
    deepseek: "to tighten an image prompt so the subject, style, and framing are specific.",
  }),
  "make-3d": lines({
    claude: "to describe the 3D asset you want and list what to change after you generate it.",
    chatgpt: "for a checklist of subject, style, and the detail you still want in the 3D model.",
    gemini: "to build a sheet of 3D prompts, the result, and what you would change.",
    perplexity: "for sourced notes on prompting for 3D assets, with links you can check.",
    deepseek: "to tighten a 3D prompt so the subject, scale, and style are specific.",
  }),
  "avatar-video": lines({
    claude: "to draft the script an avatar will speak, and you record nothing on camera.",
    chatgpt: "for a checklist of script, avatar, and the take you still approve.",
    gemini: "to build a sheet of lines, the avatar, and whether the take is approved.",
    perplexity: "for sourced notes on avatar video, with links you can check.",
    deepseek: "to shorten a spokesperson script so the avatar can say it in one take.",
  }),
  "listing-videos": lines({
    claude: "to order the rooms in a home tour and draft the captions a realtor puts on screen.",
    chatgpt: "for a checklist of listing photos, a vertical Instagram reel, captions, and music.",
    gemini: "to build a sheet of rooms, the caption for each, and whether the reel is vertical.",
    perplexity: "for sourced notes on listing-video length and music, with links you can check.",
    deepseek: "to turn a stack of listing photos into a shot order with captions and a music note.",
  }),
  "real-estate": lines({
    claude: "to compare one deal, outline a listing video, and draft the owner note you still send.",
    chatgpt: "for a checklist that covers the deal numbers, the listing video, and the outreach.",
    gemini: "to build a sheet of properties, the deal figure, the listing video, and the next owner note.",
    perplexity: "for sourced pages on deal terms, listing video, and owner outreach, with links you can check.",
    deepseek: "to say which of the deal, the listing video, or the owner outreach is still unfinished.",
  }),
};

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

/**
 * Held-out plain-language queries across the directory.
 * Written before capability scores for this set were inspected.
 * A pass is a specialist in the top 3 that fits the domain, and no off-domain specialist in the top 5.
 */

export type BroadQuery = {
  query: string;
  domains: string[];
};

const FOUNDER: BroadQuery[] = [
  { query: "pull house comparisons for me to make a CMA", domains: ["property"] },
  { query: "generate renderings from floor plans", domains: ["architecture"] },
  { query: "submit a photo of my house blueprints and generate an image", domains: ["architecture"] },
  { query: "automate my QuickBooks cleanup", domains: ["books"] },
];

type Seed = { domains: string[]; lines: string[] };

const SEEDS: Seed[] = [
  { domains: ["property"], lines: [
    "find land for sale", "vacant lot with zoning", "skip trace the owner", "fsbo leads near me",
    "off-market houses", "pull comps for this house", "build a cma", "what's the cap rate on this rental",
    "rank these flips", "listing photos need virtual staging", "write the mls description",
    "schedule a showing", "follow up with the buyer from the open house", "property management rent collection",
    "commercial listing on crexi", "home value estimate",
  ]},
  { domains: ["architecture"], lines: [
    "turn a floor plan photo into a realistic render", "blueprint to a picture of the house",
    "what will this remodel look like", "sketch to render", "generate a floor plan from a brief",
    "test fit an office", "massing study for the site", "3d tour from a floor plan",
    "render the elevation", "photoreal interior from the plan",
  ]},
  { domains: ["interior"], lines: [
    "restyle this living room photo", "virtual staging for an empty room",
    "show me the kitchen in another style", "interior design mockup", "furniture layout for the bedroom",
    "redesign my bathroom from a photo", "mood board for a condo", "stage the dining room",
  ]},
  { domains: ["legal"], lines: [
    "redline this nda", "review a vendor contract", "draft a demand letter",
    "extract clauses from the lease", "research case law on this issue", "contract playbook check",
    "summarize this agreement", "find risky terms in the msa", "help me with a parking ticket letter",
    "due diligence on these contracts",
  ]},
  { domains: ["books"], lines: [
    "reconcile quickbooks", "categorize these receipts", "send an invoice to the client",
    "clean up xero", "accounts payable invoices", "catch up the books", "scan receipts into the books",
    "profit and loss for last month", "qbo cleanup", "match the bank feed",
  ]},
  { domains: ["tax"], lines: [
    "file my 1040", "find freelance deductions", "quarterly estimated taxes",
    "start my tax return", "w2 and 1099 income", "self employed tax filing",
    "where do these deductions go", "efile my return",
  ]},
  { domains: ["investing"], lines: [
    "track my brokerage portfolio", "rebalance my 401k", "chart this ticker",
    "read the earnings transcript", "retirement cash flow model", "budget my spending",
    "net worth across accounts", "screen stocks", "is this etf expensive",
  ]},
  { domains: ["sales"], lines: [
    "write a cold email to this lead", "build an outbound sequence", "find the vp's email",
    "score this sales email before I send it", "summarize the discovery call", "enrich this prospect list",
    "cadence for inbound leads", "crm pipeline update",
  ]},
  { domains: ["seo"], lines: [
    "optimize this blog post for the keyword", "content brief for a pillar page",
    "keyword research for a new site", "why is this page not ranking", "backlink opportunities",
    "seo article from a keyword", "on page seo suggestions",
  ]},
  { domains: ["ads"], lines: [
    "generate facebook ad creatives", "ugc style video ad from the product url",
    "which ad will perform", "google ads variations", "score this ad before launch",
    "meta ads creative", "ppc headlines",
  ]},
  { domains: ["social"], lines: [
    "schedule instagram posts", "write a linkedin post", "turn this podcast into shorts",
    "caption this tiktok", "plan a week of social posts", "thread for x",
    "repurpose a webinar into clips",
  ]},
  { domains: ["email"], lines: [
    "write the newsletter", "abandoned cart email flow", "triage my inbox",
    "drip sequence for new subscribers", "snooze this thread", "subject lines for the launch",
    "behavior triggered email",
  ]},
  { domains: ["support"], lines: [
    "answer support tickets", "chatbot for order status", "deflect refund questions",
    "help center bot trained on our docs", "draft a reply to this angry customer",
    "shopify support macros", "route the ticket",
  ]},
  { domains: ["hr"], lines: [
    "source candidates for a staff engineer", "write a job description without bias",
    "screen these resumes", "schedule the interview panel", "onboard a new hire",
    "run payroll", "performance review cycle", "applicant tracking",
  ]},
  { domains: ["resumes"], lines: [
    "tailor my resume to this job description", "match keywords for the ats",
    "rewrite my resume bullets", "cover letter for this role", "linkedin headline help",
    "resume score",
  ]},
  { domains: ["education"], lines: [
    "tutor me in calculus", "explain this homework step", "flashcards from my notes",
    "practice spanish conversation", "scan this math problem", "study plan for the bar",
    "quiz me on this chapter", "language lesson",
  ]},
  { domains: ["research"], lines: [
    "literature review on this question", "what do the papers say", "chat with this pdf",
    "citation map for this paper", "summarize this study", "peer reviewed sources",
    "is this claim supported",
  ]},
  { domains: ["meetings"], lines: [
    "transcribe the meeting", "action items from the call", "summarize the zoom",
    "notes from the customer call", "clip the highlight from the interview",
    "recap for people who missed it",
  ]},
  { domains: ["scheduling"], lines: [
    "scheduling link for my calendar", "protect focus time", "book a meeting without the email ping pong",
    "timeblock tomorrow", "reschedule flexible meetings", "share my availability",
  ]},
  { domains: ["data"], lines: [
    "ask a question about this spreadsheet", "explain this excel formula",
    "forecast next quarter", "dashboard from the warehouse", "chart this csv",
    "pivot this table", "sql for this question",
  ]},
  { domains: ["code"], lines: [
    "fix the failing test", "review this pull request", "refactor this function",
    "autocomplete in the editor", "pair program in the terminal", "explain this stack trace",
    "build an app from a prompt", "write a unit test",
  ]},
  { domains: ["browser"], lines: [
    "browser agent to fill out this form", "click through the checkout",
    "scrape this page into a sheet", "automate the web workflow", "headless browser for an agent",
  ]},
  { domains: ["automation"], lines: [
    "automate this workflow across apps", "when a form is submitted send a slack message",
    "zapier style automation", "connect the crm to email", "schedule a recurring job",
  ]},
  { domains: ["security"], lines: [
    "this email looks like phishing", "triage the soc alert", "block a malicious ip",
    "detection rule for this mailbox", "is this claim fraud", "investigate the alert",
  ]},
  { domains: ["it"], lines: [
    "password reset for the new hire", "it help desk ticket", "which saas apps did employees connect",
    "my laptop is slow", "deflect the vpn question", "service desk automation",
  ]},
  { domains: ["image"], lines: [
    "remove the background from this product photo", "text to image of a poster",
    "upscale this blurry picture", "put text inside the image", "generate a product scene",
    "transparent png of the shoe",
  ]},
  { domains: ["video"], lines: [
    "text to video of a street at night", "turn this image into a video",
    "add captions to the interview", "cut the silences", "avatar video from a script",
    "animate this photo", "b-roll from a prompt",
  ]},
  { domains: ["audio"], lines: [
    "text to speech for the ad", "clone my voice", "remove noise from the podcast",
    "transcribe this interview", "voiceover in spanish", "clean up the zoom audio",
  ]},
  { domains: ["music"], lines: [
    "generate a song from a prompt", "royalty free background track", "separate the vocal stem",
    "master this mix", "beat for a youtube video", "compose a soundtrack",
  ]},
  { domains: ["3d"], lines: [
    "text to 3d model of a chair", "image to 3d of this product", "scan the room",
    "skybox from a prompt", "game ready mesh", "export a glb",
  ]},
  { domains: ["design"], lines: [
    "design a logo for the bakery", "brand kit from the name", "wireframe from a sketch",
    "landing page from a prompt", "ui mockup for the settings screen", "poster for the show",
  ]},
  { domains: ["writing"], lines: [
    "rewrite this paragraph so it sounds clearer", "paraphrase this section",
    "continue the short story", "check grammar", "blog post about the launch",
    "change the tone of this email",
  ]},
  { domains: ["slides"], lines: [
    "pitch deck from this outline", "turn the doc into slides", "google slides from a prompt",
    "speaker notes for the deck", "a presentation about the quarterly numbers",
  ]},
  { domains: ["translation"], lines: [
    "translate this contract into spanish", "localize the app strings",
    "translate the pdf", "glossary for the product terms", "support replies in french",
  ]},
  { domains: ["commerce"], lines: [
    "write shopify product descriptions", "remove the background on the catalog photos",
    "abandoned cart flow", "bulk product titles", "generate a storefront",
  ]},
  { domains: ["fitness"], lines: [
    "build me a strength workout", "log this meal", "running plan for a half marathon",
    "how did I sleep", "guided meditation", "track my calories",
  ]},
  { domains: ["travel"], lines: [
    "itinerary for four days in lisbon", "compare flights to tokyo",
    "hotel for a work trip", "how do I get from rome to florence", "plan a group trip",
  ]},
  { domains: ["games"], lines: [
    "npc that remembers the player", "generate game art in our style",
    "ai game master for discord", "prototype a game from a prompt", "set dress this level",
  ]},
  { domains: ["photo"], lines: [
    "cull this wedding shoot", "retouch the portraits", "replace the sky",
    "denoise the raw file", "edit the batch in my style",
  ]},
  { domains: ["construction"], lines: [
    "takeoff quantities from the floor plan", "document the jobsite photos",
    "roof measure from satellite", "safety inspection checklist", "schedule the trades",
    "estimate the roofing job",
  ]},
  { domains: ["mortgage"], lines: [
    "read this bank statement for the loan file", "compare loan scenarios for the borrower",
    "mortgage presentation for the client", "does this guideline allow the dti",
    "digital mortgage application", "flag a suspicious document",
  ]},
  { domains: ["insurance"], lines: [
    "estimate the car damage from these photos", "renters insurance quote",
    "this claim looks like fraud", "virtual auto claim", "commercial insurance quote for the shop",
  ]},
  { domains: ["nonprofit"], lines: [
    "draft a grant proposal", "find grants for a food pantry", "donation form for the campaign",
    "email the donors", "track grant deadlines",
  ]},
  { domains: ["smb"], lines: [
    "proposal and invoice for the photographer", "text the customer to request a review",
    "schedule the plumbing job", "client contract for the freelancer", "local business funnel",
  ]},
  { domains: ["shopping"], lines: [
    "coupon for this checkout", "price history on this amazon item",
    "which headphones should I buy", "find a lower price on this jacket", "is this a real deal",
  ]},
  { domains: ["knowledge"], lines: [
    "search the company wiki", "ask a question across our docs",
    "notes that link to each other", "where did we write the pto policy",
  ]},
  { domains: ["agents"], lines: [
    "multi agent research crew", "orchestrate agents that use tools",
    "memory for an agent", "open source agent framework",
  ]},
];

const VERB = /^(find|pull|build|write|schedule|follow|turn|generate|sketch|test|render|restyle|show|redesign|stage|redline|review|draft|extract|research|summarize|reconcile|categorize|send|clean|scan|file|start|track|rebalance|chart|read|score|optimize|caption|plan|triage|answer|source|screen|onboard|run|tailor|match|rewrite|tutor|explain|practice|transcribe|protect|book|forecast|fix|refactor|scrape|automate|clone|remove|translate|localize|compare|document|estimate|search|ask|log|cull|retouch|replace|denoise|edit|design|paraphrase|continue|check|compose|master|separate|export|create|make|add|cut|animate|clip|share|see|get|use|help|convert|listen|record|watch|take|place|measure|text|invoice|request|collect|link|pay|quote|flag|present|accept|email|host)\b/i;

function variants(line: string): string[] {
  const out = [line];
  if (VERB.test(line)) {
    out.push(`I need an AI to ${line}`);
    out.push(`please ${line} before the end of the day`);
    out.push(`can you ${line}`);
  }
  return out;
}

function typo(line: string): string {
  return line
    .replace(/\bschedule\b/i, "schedual")
    .replace(/\bmeeting\b/i, "meetng")
    .replace(/\binvoice\b/i, "invoce")
    .replace(/\bbackground\b/i, "backgroud")
    .replace(/\bresume\b/i, "resumme")
    .replace(/\bquickbooks\b/i, "quickbokks");
}

function build(): BroadQuery[] {
  const rows: BroadQuery[] = [...FOUNDER];
  for (const seed of SEEDS) {
    seed.lines.forEach((line, index) => {
      for (const query of variants(line)) rows.push({ query, domains: seed.domains });
      if (index % 3 === 0) rows.push({ query: typo(line), domains: seed.domains });
      if (index % 4 === 0 && VERB.test(line)) rows.push({ query: line.toUpperCase(), domains: seed.domains });
    });
  }
  const extra: BroadQuery[] = [
    { query: "um hey is there any way you could help me pull comps before the listing appointment tomorrow morning because the seller wants a number", domains: ["property"] },
    { query: "floorplan pic -> real looking house pls", domains: ["architecture"] },
    { query: "qbo is a mess, categorize like 400 transactions", domains: ["books"] },
    { query: "nda redline before legal sees it", domains: ["legal"] },
    { query: "make the product photo background white", domains: ["image"] },
    { query: "song idea: lofi beat about rainy tokyo", domains: ["music"] },
    { query: "tts the script, female voice, calm", domains: ["audio"] },
    { query: "npc dialogue that remembers what the player said last chapter", domains: ["games"] },
    { query: "grant narrative for a community garden nonprofit", domains: ["nonprofit"] },
    { query: "borrower dti looks high, check the guideline", domains: ["mortgage"] },
    { query: "photos of the fender bender, what will the supplement be", domains: ["insurance"] },
    { query: "half marathon in 12 weeks, build the runs", domains: ["fitness"] },
    { query: "4 days in lisbon with a kid, not too packed", domains: ["travel"] },
    { query: "logo, simple, for a coffee cart", domains: ["design"] },
    { query: "pitch deck, 10 slides, seed round", domains: ["slides"] },
    { query: "translate the help center into french", domains: ["translation"] },
    { query: "shopify titles are junk, rewrite them", domains: ["commerce"] },
    { query: "this phishing email got reported, what now", domains: ["security"] },
    { query: "new hire can't vpn, ticket is sitting there", domains: ["it"] },
    { query: "cull 2000 wedding photos before monday", domains: ["photo"] },
    { query: "roof squares from the sat image", domains: ["construction"] },
    { query: "flashcards from the lecture pdf", domains: ["education"] },
    { query: "what does the literature say about spaced repetition", domains: ["research"] },
    { query: "action items? the call ran long and I zoned out", domains: ["meetings"] },
    { query: "stop letting people book over my focus block", domains: ["scheduling"] },
    { query: "why is this vlookup exploding", domains: ["data"] },
    { query: "the ci failed again, look at the test", domains: ["code"] },
    { query: "agent that can fill the state form in the browser", domains: ["browser"] },
    { query: "when the stripe payment succeeds, slack me", domains: ["automation"] },
    { query: "cold email, short, to the head of ops", domains: ["sales"] },
    { query: "blog is ranking on page 4, fix the on page", domains: ["seo"] },
    { query: "need 10 ad variants for the shoe drop", domains: ["ads"] },
    { query: "linkedin post about the launch, not cringe", domains: ["social"] },
    { query: "newsletter for sunday, short", domains: ["email"] },
    { query: "customer wants a refund and the bot should know the policy", domains: ["support"] },
    { query: "job post sounds biased, rewrite it", domains: ["hr"] },
    { query: "resume doesn't match the jd", domains: ["resumes"] },
    { query: "paraphrase this so it isn't plagiarized vibes", domains: ["writing"] },
    { query: "text to 3d, a ceramic mug", domains: ["3d"] },
    { query: "make the vocal stem so I can practice", domains: ["music"] },
  ];
  rows.push(...extra);
  const deduped: BroadQuery[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.query.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...row, query: row.query.replace(/\s+/g, " ").trim() });
  }
  return deduped;
}

export const HELD_OUT_BROAD: BroadQuery[] = build();

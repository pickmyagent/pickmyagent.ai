/**
 * Replace scraped capability text with short verb-phrase jobs
 * and hidden search paraphrases. Does not invent prices.
 */
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../content/tools");

const BANKS = {
  "real-estate": ["find land for sale", "check zoning on a vacant lot", "skip trace a property owner", "pull comps for a house", "build a cma from recent sales", "write an mls listing description", "estimate a home value", "find fsbo leads nearby"],
  architecture: ["turn a floor plan into a render", "make a picture from a blueprint", "render an elevation of a house", "test fit an office layout", "build a massing study", "generate a floor plan from a brief", "show a remodel before it is built", "make a photoreal interior from a plan"],
  interior: ["restyle a living room photo", "virtually stage an empty room", "show a kitchen in another style", "lay out furniture in a bedroom", "build a mood board for a condo", "redesign a bathroom from a photo", "stage a dining room", "preview a room in a new finish"],
  legal: ["redline an nda", "review a vendor contract", "draft a demand letter", "extract clauses from a lease", "research case law on an issue", "check a contract against a playbook", "summarize an agreement", "find risky terms in an msa"],
  bookkeeping: ["reconcile a bank feed", "categorize receipts for the books", "catch up a messy ledger", "match transactions to the books", "clean up a bookkeeping file", "prepare a profit and loss", "scan receipts into the books", "organize expenses for an accountant"],
  "finance-ops": ["read an invoice into the books", "send an invoice to a client", "match a bill to a purchase order", "flag an expense that does not match", "capture a receipt for accounts payable", "track bills waiting to be paid", "record a vendor payment", "pull invoice fields into a ledger"],
  tax: ["start a tax return", "file a personal tax return", "find freelance deductions", "organize w2 and 1099 income", "estimate a quarterly tax payment", "efile a finished return", "sort deductions into the return", "prepare records for a tax filing"],
  investing: ["track a brokerage portfolio", "rebalance a retirement account", "chart a stock ticker", "read an earnings transcript", "screen stocks against a rule", "compare an etf on cost", "see net worth across accounts", "budget monthly spending"],
  "personal-finance": ["track spending across accounts", "build a monthly budget", "see net worth in one place", "categorize personal expenses", "plan a savings goal", "review a subscription charge", "forecast cash for the month", "compare a bill with last month"],
  sales: ["write a cold email to a lead", "build an outbound sequence", "find a vp email address", "score a sales email before sending", "summarize a discovery call", "enrich a prospect list", "update a crm pipeline", "set a cadence for inbound leads"],
  seo: ["optimize a page for a keyword", "write a content brief", "research keywords for a site", "explain why a page is not ranking", "find backlink opportunities", "draft an seo article from a keyword", "suggest on page seo edits", "group keywords into a cluster"],
  ads: ["generate a facebook ad creative", "make a ugc style video ad", "write google ads variations", "score an ad before launch", "draft meta ads creative", "write ppc headlines", "produce several ad variants", "test which ad creative is clearer"],
  social: ["schedule instagram posts", "write a linkedin post", "turn a talk into short clips", "caption a tiktok", "plan a week of social posts", "write a thread for x", "repurpose a webinar into clips", "draft a social caption"],
  email: ["write a newsletter", "build an abandoned cart email", "triage an inbox", "write a drip sequence for subscribers", "draft subject lines for a launch", "snooze an email thread", "send a behavior triggered email", "draft a reply to a thread"],
  marketing: ["draft a campaign brief", "write a landing page", "plan a product launch email", "outline a promotion", "rewrite marketing copy", "build a simple campaign calendar", "draft an offer for a list", "summarize campaign results"],
  content: ["draft a blog post", "rewrite a paragraph for clarity", "write an seo article", "outline a marketing page", "edit a draft for tone", "turn notes into a post", "write a social caption", "check a draft for grammar"],
  writing: ["rewrite a paragraph so it is clearer", "paraphrase a section", "continue a short story", "check grammar in a draft", "write a blog post about a launch", "change the tone of an email", "shorten a long paragraph", "expand a rough outline"],
  hr: ["source candidates for a role", "write a job description", "screen resumes for a role", "schedule an interview panel", "track applicants in one place", "run a performance review cycle", "keep an applicant pipeline", "compare candidates on one list"],
  hiring: ["source candidates for an opening", "screen resumes against a role", "write an unbiased job post", "schedule candidate interviews", "track applicants through stages", "summarize an interview", "compare candidates on one list", "draft outreach to a prospect"],
  resumes: ["tailor a resume to a job description", "match resume keywords for an ats", "rewrite resume bullets", "draft a cover letter for a role", "improve a linkedin headline", "score a resume against a posting", "shorten a long resume", "turn a career history into bullets"],
  education: ["tutor a calculus problem", "explain a homework step", "make flashcards from notes", "practice a language conversation", "scan a math problem", "build a study plan", "quiz a chapter", "give a language lesson"],
  learning: ["explain a lesson step by step", "quiz a student on a chapter", "make practice problems", "build a study plan", "turn notes into flashcards", "walk through a worked example", "track what a student has mastered", "give feedback on a practice answer"],
  "health-fitness": ["build a strength workout", "log a meal you ate", "plan runs for a half marathon", "review last night of sleep", "guide a short meditation", "track daily calories", "adjust a training week", "list a simple mobility routine"],
  meetings: ["transcribe a meeting", "pull action items from a call", "summarize a zoom call", "take notes on a customer call", "clip a highlight from an interview", "write a recap for people who missed it", "list decisions from a call", "turn a transcript into tasks"],
  knowledge: ["search a company wiki", "answer a question across team docs", "link notes to each other", "find where a policy was written", "summarize a handbook page", "ask a question about an sop", "collect sources for an internal answer", "keep a team knowledge base"],
  scheduling: ["share a scheduling link", "protect focus time on a calendar", "book a meeting without email ping pong", "timeblock the next day", "reschedule a flexible meeting", "show open availability", "hold a buffer between calls", "find a time the group can meet"],
  productivity: ["triage an email inbox", "draft a reply to a thread", "schedule a meeting from an email", "summarize a long thread", "snooze a message until later", "turn an email into a task", "find a time on the calendar", "keep a daily task list"],
  research: ["draft a literature review", "summarize what the papers say", "chat with a pdf", "map citations for a paper", "summarize a study", "find peer reviewed sources", "check whether a claim is supported", "collect quotes from a paper"],
  "search-rag": ["search the web for a question", "crawl a site into an index", "retrieve passages for an answer", "ground an answer in sources", "index documents for search", "query a vector store", "extract text from a page", "rank sources for a question"],
  "data-analysis": ["ask a question about a spreadsheet", "explain an excel formula", "forecast next quarter from a sheet", "chart a csv file", "pivot a table", "write sql for a question", "build a dashboard from a warehouse", "clean a messy column"],
  spreadsheets: ["ask a question in a spreadsheet cell", "explain a spreadsheet formula", "clean a column of values", "chart a range of cells", "pivot a table", "forecast a column of numbers", "fill a sheet from a prompt", "check a formula that looks wrong"],
  "coding-agents": ["fix a failing test", "review a pull request", "refactor a function", "autocomplete code in an editor", "pair program in a terminal", "explain a stack trace", "build an app from a prompt", "write a unit test"],
  "dev-tools": ["read an api reference", "trace an error in a service", "review a code change", "document a function", "search a codebase", "run a check on a repo", "explain a stack trace", "scaffold a small module"],
  "browser-agents": ["fill a form in the browser", "click through a checkout flow", "scrape a page into a sheet", "automate a web workflow", "run a headless browser for an agent", "stop at a login screen", "extract a table from a page", "repeat a browser task"],
  "tool-use": ["connect an agent to a tool", "call an api from an agent", "search the web for an agent", "fill a browser form for an agent", "pass a page to a model", "run a tool with structured input", "chain two tools in one task", "return a source with the answer"],
  "agent-frameworks": ["orchestrate agents that use tools", "run a multi agent research crew", "keep memory for an agent", "use an open source agent framework", "hand a task from one agent to another", "define a tool an agent can call", "trace an agent run", "retry a failed agent step"],
  "workflow-automation": ["automate a workflow across apps", "send a slack message when a form is submitted", "connect a crm to email", "schedule a recurring job", "move a row into another app", "trigger a step when a payment succeeds", "sync a contact between two apps", "build a zapier style automation"],
  security: ["flag a phishing email", "triage a soc alert", "block a malicious ip", "write a detection rule for a mailbox", "investigate an alert", "summarize a security incident", "check a suspicious link", "draft a response to a reported phish"],
  "it-support": ["reset a password for a new hire", "open an it help desk ticket", "see which saas apps an employee connected", "deflect a vpn question", "automate a service desk reply", "route a laptop issue", "answer a common it question", "log a ticket and the fix"],
  image: ["remove the background from a product photo", "make an image from a text prompt", "upscale a blurry picture", "put text inside an image", "generate a product scene", "export a transparent png", "edit an image with a prompt", "vary a picture in a new style"],
  video: ["make a video from a text prompt", "turn an image into a video", "add captions to an interview", "cut silences from a clip", "make an avatar video from a script", "animate a still photo", "find b-roll from a prompt", "export a short vertical clip"],
  "audio-voice": ["turn text into speech for an ad", "clone a voice from a short clip", "remove noise from a podcast", "transcribe an interview", "make a voiceover in another language", "clean up zoom audio", "adjust the pace of a voiceover", "export a narration track"],
  music: ["generate a song from a prompt", "make a royalty free background track", "separate a vocal stem", "master a mix", "make a beat for a video", "compose a short soundtrack", "extend a musical idea", "export stems from a song"],
  "3d": ["make a 3d model from text", "turn an image into a 3d model", "scan a room into a model", "make a skybox from a prompt", "build a game ready mesh", "export a glb file", "retopologize a scan", "preview a model in the browser"],
  design: ["design a logo for a business", "build a brand kit from a name", "make a wireframe from a sketch", "draft a landing page from a prompt", "mock up a settings screen", "design a poster for an event", "pick colors and type", "export logo files"],
  "creative-media": ["edit a creative asset", "generate a picture from a prompt", "cut a short video", "clean up an audio clip", "export a file for a project", "vary a draft in a new style", "remove a simple background", "add a caption to a clip"],
  photography: ["cull a wedding shoot", "retouch a portrait", "replace a sky in a photo", "denoise a raw file", "edit a batch in one style", "straighten a horizon", "lift shadows in a photo", "export a retouched image"],
  gaming: ["make an npc that remembers the player", "generate game art in a house style", "run an ai game master", "prototype a game from a prompt", "set dress a game level", "write branching dialogue", "export a sprite sheet", "keep memory of what the player said"],
  "game-ai": ["give an npc memory of the player", "write dialogue for a game character", "run a game master for a discord table", "prototype a character from a prompt", "keep quest state for an npc", "vary a character voice line", "export dialogue for a game", "remember a choice the player made"],
  translation: ["translate a contract into spanish", "localize app strings", "translate a pdf", "keep a glossary of product terms", "draft a support reply in french", "translate a help center article", "preserve a term in the glossary", "review a translation for tone"],
  presentations: ["build a pitch deck from an outline", "turn a doc into slides", "make google slides from a prompt", "write speaker notes for a deck", "draft a presentation about quarterly numbers", "redraw a slide for clarity", "export a finished deck", "shorten a slide to one idea"],
  ecommerce: ["write a shopify product description", "remove the background on a catalog photo", "rewrite bulk product titles", "draft an abandoned cart note", "generate a simple storefront", "write a product title and bullets", "tag a catalog photo", "update a product listing"],
  shopping: ["find a coupon for a checkout", "show price history for an item", "compare products before a purchase", "find a lower price on a product", "check whether a deal is real", "list pros and cons of a product", "track a price drop", "compare two models side by side"],
  travel: ["build an itinerary for a city", "compare flights for a trip", "find a hotel for a work trip", "plan how to get between two cities", "plan a group trip", "balance a day so it is not packed", "list neighborhoods to stay in", "draft a day by day plan"],
  construction: ["take off quantities from a floor plan", "document jobsite photos", "measure a roof from a satellite image", "make a safety inspection checklist", "schedule the trades", "estimate a roofing job", "list materials for a task", "note a change on the job"],
  mortgage: ["read a bank statement for a loan file", "compare loan scenarios for a borrower", "draft a mortgage presentation", "check whether a guideline allows the dti", "start a digital mortgage application", "flag a suspicious document in a file", "list documents still missing", "summarize a loan scenario"],
  insurance: ["estimate car damage from photos", "start a renters insurance quote", "flag a claim that looks like fraud", "open a virtual auto claim", "draft a commercial insurance quote", "summarize damage in a photo set", "list what a claim file still needs", "compare two policy options"],
  nonprofit: ["draft a grant proposal", "find grants for a food pantry", "build a donation form for a campaign", "email donors about a campaign", "track grant deadlines", "write a grant narrative", "summarize a funder guideline", "thank a donor"],
  "small-business": ["draft a proposal and an invoice", "text a customer to request a review", "schedule a plumbing job", "draft a client contract for a freelancer", "plan the week for a one person shop", "follow up with a waiting customer", "capture a receipt and a customer note", "keep a simple local business checklist"],
  "customer-support": ["answer a support ticket", "check an order status", "deflect a refund question", "answer from a help center", "draft a reply to an angry customer", "apply a support macro", "route a ticket to the right queue", "cite the policy in a reply"],
  "general-assistants": ["draft a first version of a note", "outline steps for a task", "summarize a long passage", "rewrite a paragraph for clarity", "list options for a decision", "turn rough notes into a checklist"],
};

const TAG_JOBS = {
  "showing-scheduling": ["schedule a home showing", "book an open house", "send a showing reminder", "confirm a lockbox time", "set a showing appointment", "list times a buyer can tour", "remind the agent about a showing", "hold an open house slot"],
  "transaction-coordination": ["track a transaction checklist", "collect closing documents", "note an earnest money deadline", "list what the file still needs", "remind the agent about a disclosure", "keep a purchase file in one place"],
  payroll: ["run payroll for the team", "check hours before payday", "prepare a paycheck run", "list payroll questions to confirm", "track wages for the period", "review deductions before payday"],
  "customer-follow-up": ["follow up with a customer after a purchase", "thank a recent buyer", "ask how the product is working out", "draft a check in after a job", "reengage a past customer", "send a note to someone who already bought"],
  "review-requests": ["text a customer to request a review", "ask for a google review", "draft a review request after a job", "reply to a public review", "track who has been asked for a review", "send a short rating request"],
  quotes: ["draft a quote from the job details", "write a client proposal", "price a job for a customer", "send a proposal to a client", "turn a scope into an estimate", "update a quote before it goes out"],
  contracts: ["draft a client contract", "review a vendor contract", "mark clauses a person should read", "summarize an agreement", "compare a contract with a playbook", "list terms that need a lawyer"],
  "sales-tax": ["calculate sales tax on an order", "prepare a sales tax filing", "separate taxable sales from receipts", "file a vat return", "check a gst return", "list a rate and a filing date to confirm"],
  "shift-scheduling": ["schedule shifts for a restaurant", "build a weekly staff rota", "see who can work a shift", "message the team about the schedule", "cover an open shift", "track hours on the rota"],
};

const EXTRAS = {
  property: ["home value estimate", "off-market houses", "schedule a showing", "listing photos need virtual staging", "pull comps for this house"],
  books: ["reconcile quickbooks", "clean up xero", "qbo cleanup", "match the bank feed", "profit and loss for last month"],
  tax: ["file my 1040", "quarterly estimated taxes", "where do these deductions go"],
  showings: ["schedule a showing", "open house schedule", "showing appointment"],
  payroll: ["run payroll", "paychecks for the staff", "hours before payday"],
  travel: ["how do I get from rome to florence", "itinerary for four days in lisbon", "compare flights to tokyo"],
  photo: ["cull this wedding shoot", "denoise the raw file", "retouch the portraits"],
  music: ["master this mix", "beat for a youtube video", "lofi beat about rainy tokyo"],
  ads: ["which ad will perform", "ugc style video ad"],
  code: ["build an app from a prompt", "fix the failing test", "the ci failed again"],
  agents: ["orchestrate agents that use tools", "open source agent framework", "memory for an agent"],
};

const ROUTES = [
  [/payroll|paycheck|wages/, "payroll"],
  [/showing|open house|lockbox/, "showings"],
  [/interior|staging|redesign a room|room design|furniture/, "interior"],
  [/floor plan|blueprint|architect|massing|elevation/, "architecture"],
  [/sales tax|vat\b|gst\b/, "salesTax"],
  [/grant|donor|nonprofit|fundraising/, "nonprofit"],
  [/mortgage|borrower|loan file|eclosing|e-closing/, "mortgage"],
  [/insurance|underwriting/, "insurance"],
  [/roof|jobsite|takeoff|construction/, "construction"],
  [/resume|cover letter|job search/, "resumes"],
  [/tutor|flashcard|homework|study plan|quiz/, "education"],
  [/workout|calorie|meditation|fitness|meal/, "health-fitness"],
  [/transcribe|meeting note|notetaker|action item/, "meetings"],
  [/wiki|knowledge base|handbook/, "knowledge"],
  [/newsletter|inbox|email campaign|drip/, "email"],
  [/keyword|backlink|\bseo\b|ranking/, "seo"],
  [/ad creative|facebook ad|google ads|\bppc\b/, "ads"],
  [/instagram|tiktok|linkedin|social post/, "social"],
  [/invoice|receipt|bookkeep|quickbooks|reconcil/, "bookkeeping"],
  [/portfolio|brokerage|ticker|401k|etf/, "investing"],
  [/cold email|outbound|prospect|pipeline/, "sales"],
  [/contract|nda|clause|legal/, "legal"],
  [/shift|rota|roster/, "shifts"],
  [/itinerary|flight|hotel|\btrip\b/, "travel"],
  [/npc|game master|sprite|game asset/, "gaming"],
  [/song|soundtrack|stem|beat\b|music/, "music"],
  [/voice|speech|podcast|voiceover/, "audio-voice"],
  [/video|caption|b-roll|avatar/, "video"],
  [/3d|mesh|glb|skybox/, "3d"],
  [/logo|brand kit|wireframe|figma|mockup/, "design"],
  [/retouch|raw file|portrait|cull/, "photography"],
  [/translate|locali[sz]|glossary/, "translation"],
  [/slide|pitch deck|presentation/, "presentations"],
  [/shopify|product description|storefront|catalog/, "ecommerce"],
  [/coupon|price history|headphones|shopping/, "shopping"],
  [/phishing|soc\b|malware|threat/, "security"],
  [/help desk|password reset|\bvpn\b|service desk/, "it-support"],
  [/spreadsheet|excel|formula|csv|pivot/, "spreadsheets"],
  [/pull request|refactor|github|unit test|codebase/, "coding-agents"],
  [/browser|scrape|headless|fill a form/, "browser-agents"],
  [/zapier|workflow|automation/, "workflow-automation"],
  [/agent framework|multi-agent|orchestrat/, "agent-frameworks"],
];

const ROUTE_BANK = {
  payroll: TAG_JOBS.payroll,
  showings: TAG_JOBS["showing-scheduling"],
  salesTax: TAG_JOBS["sales-tax"],
  shifts: TAG_JOBS["shift-scheduling"],
  interior: BANKS.interior,
  architecture: BANKS.architecture,
  nonprofit: BANKS.nonprofit,
  mortgage: BANKS.mortgage,
  insurance: BANKS.insurance,
  construction: BANKS.construction,
  resumes: BANKS.resumes,
  education: BANKS.education,
  "health-fitness": BANKS["health-fitness"],
  meetings: BANKS.meetings,
  knowledge: BANKS.knowledge,
  email: BANKS.email,
  seo: BANKS.seo,
  ads: BANKS.ads,
  social: BANKS.social,
  bookkeeping: BANKS.bookkeeping,
  investing: BANKS.investing,
  sales: BANKS.sales,
  legal: BANKS.legal,
  travel: BANKS.travel,
  gaming: BANKS.gaming,
  music: BANKS.music,
  "audio-voice": BANKS["audio-voice"],
  video: BANKS.video,
  "3d": BANKS["3d"],
  design: BANKS.design,
  photography: BANKS.photography,
  translation: BANKS.translation,
  presentations: BANKS.presentations,
  ecommerce: BANKS.ecommerce,
  shopping: BANKS.shopping,
  security: BANKS.security,
  "it-support": BANKS["it-support"],
  spreadsheets: BANKS.spreadsheets,
  "coding-agents": BANKS["coding-agents"],
  "browser-agents": BANKS["browser-agents"],
  "workflow-automation": BANKS["workflow-automation"],
  "agent-frameworks": BANKS["agent-frameworks"],
};

const BRAND_OK = new Set(["bill", "wave", "make", "pitch", "rows", "layer", "pilot", "remote", "lever", "build", "scale", "super", "magic", "copy", "house", "smart", "cloud", "fresh", "quick", "power", "light", "clear", "simple", "local", "paper", "resume", "slack", "excel", "video", "audio", "image", "music", "email", "photo", "voice", "sheet", "notes", "legal", "slide"]);
const REPEAT_OK = new Set(["a", "an", "the", "to", "for", "and", "of", "in", "on", "with", "from", "into", "your", "you", "our"]);

function brandTokens(name, slug) {
  return `${name} ${slug.replace(/-/g, " ")}`.toLowerCase().match(/[a-z0-9]+/g)?.filter((token) => token.length >= 5 && !BRAND_OK.has(token)) ?? [];
}

function bad(text, brand) {
  const words = text.trim().split(/\s+/);
  if (words.length > 14 || text.trim().length < 12) return true;
  if (/\$\s?\d|https?:\/\/|\bwww\.|\b(?:app store|play store|google play|download)\b/i.test(text)) return true;
  const seen = new Set();
  for (const word of words) {
    const token = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!token) continue;
    if (seen.has(token) && !REPEAT_OK.has(token)) return true;
    seen.add(token);
    if (brand.includes(token)) return true;
  }
  return !/^[a-z]/.test(text);
}

function unique(list) {
  const out = [];
  const seen = new Set();
  for (const item of list) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function jobsFor(tool) {
  const blob = `${tool.categories.join(" ")} ${tool.shortDescription} ${(tool.bestFor ?? []).join(" ")} ${(tool.useCaseTags ?? []).join(" ")}`.toLowerCase();
  const brand = brandTokens(tool.name, tool.slug);
  let jobs = [];
  for (const tag of tool.useCaseTags ?? []) {
    if (TAG_JOBS[tag]) jobs.push(...TAG_JOBS[tag]);
  }
  const category = tool.categories[0];
  const mixed = new Set(["creative-media", "content", "productivity"]);
  let routed = null;
  for (const [pattern, key] of ROUTES) {
    if (pattern.test(blob)) {
      routed = key;
      break;
    }
  }
  const routeMatchesCategory = routed === category
    || (routed === "bookkeeping" && (category === "finance-ops" || category === "bookkeeping"))
    || (routed === "showings" && category === "real-estate")
    || (routed === "payroll" && category === "hr")
    || (routed === "salesTax" && category === "tax")
    || (routed === "shifts" && (category === "small-business" || category === "scheduling"));
  if (routed && ROUTE_BANK[routed] && (mixed.has(category) || routeMatchesCategory)) {
    jobs.push(...ROUTE_BANK[routed]);
  }
  jobs.push(...(BANKS[category] ?? BANKS.writing));
  if (tool.generalPurpose) jobs = [...BANKS["general-assistants"]];
  jobs = unique(jobs).filter((job) => !bad(job, brand));
  return jobs.slice(0, 8);
}

function phrasesFor(tool, jobs) {
  const brand = brandTokens(tool.name, tool.slug);
  const phrases = [];
  for (const job of jobs.slice(0, 4)) {
    phrases.push(job, `help me ${job}`, `I need to ${job}`, `can you ${job}`);
  }
  const blob = `${tool.categories.join(" ")} ${(tool.useCaseTags ?? []).join(" ")}`;
  const extras = [];
  if (/real-estate|showing|property/.test(blob)) extras.push(...EXTRAS.property, ...EXTRAS.showings);
  if (/bookkeep|finance|invoice|receipt/.test(blob)) extras.push(...EXTRAS.books);
  if (/payroll/.test(blob)) extras.push(...EXTRAS.payroll);
  if (/\btax\b/.test(blob)) extras.push(...EXTRAS.tax);
  if (tool.categories.includes("travel")) extras.push(...EXTRAS.travel);
  if (tool.categories.includes("photography")) extras.push(...EXTRAS.photo);
  if (tool.categories.includes("music")) extras.push(...EXTRAS.music);
  if (tool.categories.includes("ads")) extras.push(...EXTRAS.ads);
  if (tool.categories.includes("coding-agents") || tool.categories.includes("dev-tools")) extras.push(...EXTRAS.code);
  if (tool.categories.includes("agent-frameworks")) extras.push(...EXTRAS.agents);
  for (const extra of extras) phrases.push(extra);
  let list = unique(phrases).filter((item) => !bad(item, brand));
  let cursor = 0;
  while (list.length < 10 && jobs.length > 0) {
    const extra = `please ${jobs[cursor % jobs.length]} today`;
    cursor += 1;
    if (cursor > 30) break;
    if (!bad(extra, brand) && !list.includes(extra)) list.push(extra);
  }
  return list.slice(0, 16);
}

let short = 0;
for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith(".json")) continue;
  const full = path.join(dir, file);
  const tool = JSON.parse(fs.readFileSync(full, "utf8"));
  const jobs = jobsFor(tool);
  if (jobs.length < 5) {
    short += 1;
    console.error(`short ${tool.slug} ${jobs.length}`);
    continue;
  }
  tool.capabilities = jobs;
  tool.searchPhrases = phrasesFor(tool, jobs);
  fs.writeFileSync(full, `${JSON.stringify(tool, null, 2)}\n`);
}
console.log(`rewrote capabilities, short ${short}`);

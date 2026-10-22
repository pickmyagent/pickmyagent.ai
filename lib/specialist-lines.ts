/**
 * One natural why-line per specialist and use case.
 * Each sentence starts with the tool name and a verb. No prices, no "is for".
 */
const LINES: Record<string, Record<string, readonly string[]>> = {
  "find-off-market": {
    batchleads: [
      "BatchLeads saves owner phone numbers and emails beside each property on a list.",
    ],
    dealmachine: [
      "DealMachine pulls owner records and tags a property during a drive.",
    ],
    "launch-control": [
      "Launch Control sends texts to owners whose numbers are already on a list.",
    ],
    propstream: [
      "PropStream searches property records, including off-market listings, from one set of filters.",
    ],
    resimpli: [
      "REsimpli calls, texts, and emails owners from the same CRM.",
    ],
  },
  "find-land": {
    acres: [
      "Acres shows parcel maps and basic land insights before an owner lookup.",
    ],
    "land-id": [
      "Land id looks up parcel boundaries and owner names on land across the country.",
    ],
    propstream: [
      "PropStream searches parcel records with the same filters it uses on other land listings.",
    ],
    regrid: [
      "Regrid sells parcel boundaries and owner fields for one county or one state.",
    ],
  },
  "rank-property-deals": {
    dealcheck: [
      "DealCheck calculates rental cash flow, flip profit, and commercial numbers side by side.",
      "DealCheck runs a rental, flip, or commercial calculator and lines the deals up together.",
    ],
    mashvisor: [
      "Mashvisor estimates rental income on a property you are ranking against others.",
    ],
    propstream: [
      "PropStream filters property records, including off-market ones, before the deals get ranked.",
    ],
  },
  "manage-portfolio": {
    composer: [
      "Composer automates one trading strategy attached to an investment account.",
    ],
    kubera: [
      "Kubera tracks a household balance sheet next to the rest of an investment portfolio.",
    ],
    magnifi: [
      "Magnifi links brokerage accounts and shows a portfolio summary.",
    ],
    "portfolio-pilot": [
      "PortfolioPilot lines up accounts and reads the investment portfolio from them.",
    ],
    range: [
      "Range tracks portfolio, tax, and equity details with Rai, the assistant inside its advisory membership.",
    ],
  },
  "do-taxes": {
    flyfin: [
      "FlyFin finds deductions and has a CPA file self-employed taxes.",
    ],
    keeper: [
      "Keeper tracks expenses and files federal and state taxes, including quarterly payments.",
    ],
    taxact: [
      "TaxAct walks a personal return through guided questions so the taxes get filed online.",
    ],
    turbotax: [
      "TurboTax guides a personal tax return from the first question to the filed form.",
    ],
  },
  "customer-support": {
    decagon: [
      "Decagon handles customer chat, email, and voice in one support conversation.",
    ],
    "intercom-fin": [
      "Intercom Fin answers customer conversations inside a support inbox.",
    ],
    sierra: [
      "Sierra builds customer-service agents for a brand's support conversations.",
    ],
    zendesk: [
      "Zendesk runs a support suite and applies its AI to service tickets.",
    ],
  },
  "sales-outreach": {
    apollo: [
      "Apollo looks up contacts and companies before anyone writes sales outreach.",
    ],
    clay: [
      "Clay pulls lead data from many providers into one table for outreach.",
    ],
    instantly: [
      "Instantly sends sales email sequences from more than one inbox.",
    ],
    smartlead: [
      "Smartlead sets up cold-email outreach and fixes the sequence when it breaks.",
    ],
  },
  "manage-inbox": {
    fyxer: [
      "Fyxer organizes an email inbox and drafts the replies.",
    ],
    shortwave: [
      "Shortwave searches an email inbox and drafts from that client.",
    ],
    "spark-mail": [
      "Spark drafts email replies and sorts the inbox.",
    ],
  },
  "scheduling-assistant": {
    lindy: [
      "Lindy takes calendar chores and inbox follow-ups as scheduling work.",
    ],
    motion: [
      "Motion plans a calendar and a task list in the same scheduling view.",
    ],
    reclaim: [
      "Reclaim shares scheduling links and holds focus blocks on the calendar.",
    ],
  },
  "marketing-promotions": {
    klaviyo: [
      "Klaviyo sends email and text campaigns and builds a flow for a promotion.",
    ],
    mailchimp: [
      "Mailchimp creates an email campaign and can send it to a list.",
    ],
  },
  "create-content": {
    "copy-ai": [
      "Copy.ai runs marketing content and go-to-market writing through a workflow.",
    ],
    jasper: [
      "Jasper drafts marketing content with agents in a workspace built for that writing.",
    ],
    writesonic: [
      "Writesonic writes content and tracks where the brand gets mentioned.",
    ],
  },
  "analyze-data": {
    hex: [
      "Hex keeps a shared notebook where a team analyzes data with its agent.",
    ],
    julius: [
      "Julius answers questions about data in a spreadsheet chat.",
    ],
    rows: [
      "Rows analyzes spreadsheet data with an assistant sitting in the grid.",
    ],
  },
  "hire-candidates": {
    gem: [
      "Gem screens candidates and reports where each one stands.",
    ],
    metaview: [
      "Metaview finds candidate profiles and takes notes in the interview.",
    ],
    paradox: [
      "Paradox schedules candidates and takes applications in a conversation.",
    ],
  },
  "plan-travel": {
    guidegeek: [
      "GuideGeek plans travel across flights, stays, restaurants, and experiences.",
    ],
    wonderplan: [
      "Wonderplan drafts a custom itinerary for the trip you still book yourself.",
    ],
  },
  "shop-products": {
    "alexa-shopping": [
      "Alexa for Shopping answers product questions and recommends items in Amazon's app.",
    ],
    daydream: [
      "Daydream shops fashion products by chat across thousands of stores.",
    ],
  },
  "finance-ops": {
    "bill-com": [
      "BILL sends invoices and pays bills inside one finance product.",
    ],
    dext: [
      "Dext captures receipts and invoices so bookkeeping can process them.",
    ],
    ramp: [
      "Ramp runs cards and expenses together in one finance platform.",
    ],
    "vic-ai": [
      "Vic.ai reads invoices for an accounts-payable team.",
    ],
  },
  "knowledge-qa": {
    glean: [
      "Glean searches internal company documents through a large set of connectors.",
    ],
    guru: [
      "Guru answers questions from company cards and lets its agents improve those cards.",
    ],
    notion: [
      "Notion searches the docs and wikis a team already keeps.",
    ],
    slite: [
      "Slite answers questions over a team's docs with its Ask search.",
    ],
  },
  "social-media": {
    buffer: [
      "Buffer schedules social posts and drafts captions for a channel.",
    ],
    hootsuite: [
      "Hootsuite plans and publishes social posts in one suite.",
    ],
    ocoya: [
      "Ocoya creates social posts and puts them on a schedule.",
    ],
    predis: [
      "Predis.ai generates social posts and ad creatives.",
    ],
  },
  "it-helpdesk": {
    freshservice: [
      "Freshservice runs an IT service desk that takes incoming requests.",
    ],
    moveworks: [
      "Moveworks routes employee IT requests and answers common ones itself.",
    ],
  },
  "security-ops": {
    abnormal: [
      "Abnormal flags email threats by watching how an account usually behaves.",
    ],
    "charlotte-ai": [
      "Charlotte AI assists security analysts inside the CrowdStrike platform.",
    ],
    dropzone: [
      "Dropzone AI reviews threat alerts and shows the reasoning behind each one.",
    ],
  },
  "deep-research": {
    elicit: [
      "Elicit gathers papers for a literature review in its research assistant.",
    ],
    scispace: [
      "SciSpace reads scientific papers and supports a literature review with chat.",
    ],
  },
  "tutoring": {
    khanmigo: [
      "Khanmigo teaches a concept and also helps a teacher plan that same lesson.",
    ],
    quizlet: [
      "Quizlet turns notes into a practice test and explains a homework step with more practice.",
    ],
    studyfetch: [
      "StudyFetch explains a subject from your materials and builds practice from them.",
    ],
    "synthesis-tutor": [
      "Synthesis Tutor teaches K-5 math and adapts each lesson to the child.",
    ],
  },
  "learn-language": {
    "duolingo-max": [
      "Duolingo Max practices a language with the GPT-4 features Duolingo added for Max.",
    ],
  },
  "game-creative": {
    capcut: [
      "CapCut edits video for YouTube, TikTok, and Reels, including basic cuts.",
    ],
    captions: [
      "Captions trims a video and adds on-screen words for a social clip.",
    ],
    descript: [
      "Descript edits a video by changing the words in its transcript.",
    ],
    eklipse: [
      "Eklipse finds vertical highlight clips from Twitch, YouTube, and Kick.",
    ],
    kapwing: [
      "Kapwing trims, captions, and resizes a video into a social clip in the browser.",
    ],
    opus: [
      "Opus Clip cuts a long video into short clips.",
    ],
    streamladder: [
      "StreamLadder reframes a horizontal stream clip into a vertical short for Reels or TikTok.",
    ],
  },
  "video-generation": {
    higgsfield: [
      "Higgsfield generates cinematic clips with camera presets such as a POV or a helicopter shot.",
    ],
    pika: [
      "Pika creates a short video from a prompt, a photo, or keyframes.",
    ],
    runway: [
      "Runway generates footage from a prompt and then edits that video.",
    ],
    seedance: [
      "Seedance renders video from text, an image, or a reference clip in Dreamina.",
    ],
  },
  "voice-audio": {
    elevenlabs: [
      "ElevenLabs generates voice and audio from a prompt.",
    ],
  },
  "make-images": {
    midjourney: [
      "Midjourney draws images from a text prompt.",
    ],
    scenario: [
      "Scenario draws game art from a prompt.",
    ],
  },
  "make-3d": {
    meshy: [
      "Meshy turns text or a picture into a 3D asset.",
    ],
  },
  "avatar-video": {
    "d-id": [
      "D-ID turns a photo and a script into a talking-head video.",
    ],
    heygen: [
      "HeyGen generates an avatar or spokesperson video from a script.",
    ],
    synthesia: [
      "Synthesia generates an avatar video from a script and a stock or custom avatar.",
    ],
  },
  "listing-videos": {
    autoreel: [
      "AutoReel turns listing photos into a property video with music and captions.",
    ],
    boxbrownie: [
      "BoxBrownie builds a virtual tour of the home from 360 photos.",
    ],
    canva: [
      "Canva trims listing clips, adds captions, and can add music.",
    ],
    capcut: [
      "CapCut trims walkthrough footage, adds captions, and resizes it for a vertical reel.",
    ],
    descript: [
      "Descript edits the video by editing the transcript and adds captions.",
    ],
    kapwing: [
      "Kapwing trims a walkthrough, adds captions, and resizes the video.",
    ],
  },
  "real-estate": {
    acres: [
      "Acres shows parcel maps and basic land insights before an owner lookup.",
    ],
    autoreel: [
      "AutoReel turns listing photos into a property video with music and captions.",
    ],
    dealcheck: [
      "DealCheck calculates rental cash flow, flip profit, and commercial numbers side by side.",
    ],
    dealmachine: [
      "DealMachine pulls owner records and tags a property during a drive.",
    ],
    propstream: [
      "PropStream searches property records, including off-market listings, from one set of filters.",
    ],
  },
  "write-resume": {
    kickresume: [
      "Kickresume writes resume bullets from a job title and scores the draft.",
    ],
    rezi: [
      "Rezi builds a resume, scores the sections, and pulls keywords from a job description.",
    ],
    teal: [
      "Teal writes a resume tailored to a job description and tracks the jobs you save.",
    ],
  },
  "coding-agents": {
    continue: [
      "Continue installs an open-source coding agent in the editor you already use.",
    ],
    cursor: [
      "Cursor edits code in the repo from a desktop agent.",
    ],
    "github-copilot": [
      "GitHub Copilot writes code and can carry a change toward a merge.",
    ],
    replit: [
      "Replit runs a coding agent inside a browser editor.",
    ],
  },
  "workflow-automation": {
    make: [
      "Make builds visual automations across the apps a repeated task touches.",
    ],
    n8n: [
      "n8n runs multi-step workflows you can host yourself for a repeated task.",
    ],
    zapier: [
      "Zapier connects hosted apps so a repeated task fires without a server of your own.",
    ],
  },
  "multi-agent-workflows": {
    autogen: [
      "AutoGen (Microsoft) runs conversations between several agents in Python.",
    ],
    crewai: [
      "CrewAI splits one job across agents that each have a role.",
    ],
    dify: [
      "Dify lays out agent workflows on a visual canvas you can host.",
    ],
    flowise: [
      "Flowise assembles low-code model flows for agents on a server you run.",
    ],
    langchain: [
      "LangChain composes agents that call tools in code you write.",
    ],
  },
  "research-rag": {
    mem0: [
      "Mem0 stores memory an agent can read later when it answers from source pages.",
    ],
    pinecone: [
      "Pinecone keeps vectors a search uses to look up source pages.",
    ],
  },
  "meetings-knowledge": {
    granola: [
      "Granola takes meeting notes alongside the call.",
    ],
    notion: [
      "Notion keeps meeting notes and the docs around them in one workspace.",
    ],
    obsidian: [
      "Obsidian stores meeting notes in files on your computer.",
    ],
  },
  "tool-use-browser": {
    "browser-use": [
      "Browser Use opens pages and clicks through steps in a browser from Python.",
    ],
    composio: [
      "Composio connects an agent to outside apps when the job needs more than browser steps.",
    ],
    skyvern: [
      "Skyvern automates clicks and form steps inside a browser.",
    ],
  },
  "game-npcs": {
    bitpart: [
      "Bitpart supplies an engine and SDKs for a character that talks in a game.",
    ],
    convai: [
      "Convai runs characters that talk with the player inside a game.",
    ],
    inworld: [
      "Inworld writes dialogue for a game character on a hosted stack.",
    ],
    mistscale: [
      "MistScale remembers what a game character should know about the player.",
    ],
    "nvidia-ace": [
      "NVIDIA ACE for Games offers downloads and plugins for an in-game character.",
    ],
    tavernbard: [
      "Tavernbard plays a game master in Discord and can speak character lines there.",
    ],
  },
};

/** Photo-to-video listing queries. Edit, trim, and caption queries stay on the editor lines. */
export function isListingPhotoQuery(query: string): boolean {
  return /\b(photos?|pictures?|images?)\b/i.test(query)
    && !/\b(edit|editing|trim|trimming|caption|captions)\b/i.test(query);
}

const LISTING_PHOTO_LINES: Record<string, string> = {
  autoreel: "AutoReel turns listing photos into a property video with music and captions.",
  boxbrownie: "BoxBrownie builds a virtual tour of the home from 360 photos.",
  canva: "Canva turns listing photos into a video from a real estate template and can add music.",
  capcut: "CapCut turns property photos into a realtor slideshow with captions and music.",
  descript: "Descript turns property photos or clips into a listing video with room labels and music.",
  kapwing: "Kapwing turns listing photos into a walkthrough-style video with music and text.",
};

export function listingSpecialistLine(toolSlug: string, query: string): string | null {
  if (isListingPhotoQuery(query)) return LISTING_PHOTO_LINES[toolSlug] ?? null;
  return specialistLine("listing-videos", toolSlug);
}

/** Docs-backed lines for a workflow tool that can touch both jobs in one automation. */
export const BRIDGE_LINES: Record<string, string> = {
  n8n: "n8n connects Mailchimp campaigns and QuickBooks invoices in one workflow.",
  make: "Make connects Mailchimp campaigns and QuickBooks invoices in one scenario.",
  zapier: "Zapier connects a new Mailchimp subscriber to a QuickBooks invoice.",
};

export function specialistLine(useCaseSlug: string, toolSlug: string, index = 0): string | null {
  const lines = LINES[useCaseSlug]?.[toolSlug];
  if (!lines || lines.length === 0) return null;
  return lines[Math.abs(index) % lines.length] ?? null;
}

export function specialistLinePairs(): Array<{ useCaseSlug: string; toolSlug: string; line: string }> {
  const pairs: Array<{ useCaseSlug: string; toolSlug: string; line: string }> = [];
  for (const [useCaseSlug, tools] of Object.entries(LINES)) {
    for (const [toolSlug, lines] of Object.entries(tools)) {
      for (const line of lines) pairs.push({ useCaseSlug, toolSlug, line });
    }
  }
  for (const [toolSlug, line] of Object.entries(LISTING_PHOTO_LINES)) {
    pairs.push({ useCaseSlug: "listing-videos", toolSlug, line });
  }
  return pairs;
}

/**
 * Regenerates content/tools and content/use-cases from the October 15, 2026
 * smoke-test export plus the editorial fields in this file.
 *
 * Re-running this overwrites tool JSON. Day-to-day edits belong in
 * content/tools/*.json — see the README.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const smoke = JSON.parse(
  fs.readFileSync(path.join(root, "content/source/smoke-tests.json"), "utf8"),
);

/** @type {Record<string, object>} */
const editorial = {
  crewai: {
    shortDescription:
      "Open-source framework for crews of role-based agents that split a job into tasks.",
    longDescription:
      "CrewAI is the crew-style option in this catalog: you define roles and tasks, and the Python library coordinates them. The open-source package and the hosted product are separate. Figures below are only what we could read on the pricing page during the October 15, 2026 check.",
    categories: ["agent-frameworks"],
    toolTypes: ["framework", "agent"],
    platforms: ["cli", "self_host"],
    pricingModel: ["freemium", "enterprise"],
    bestFor: [
      "Multi-step jobs you can split across roles",
      "Python teams who want a crew abstraction they can install",
    ],
    notIdealFor: [
      "A single chat box with no workflow",
      "Teams that only want a closed SaaS and will not touch Python",
    ],
  },
  langchain: {
    shortDescription:
      "Open-source libraries for agents, chains, and tool calling, plus optional LangSmith traces.",
    longDescription:
      "LangChain is a set of libraries for composing agent and tool-calling workflows. LangSmith, the tracing product on the same site, is separate: the pricing page we read listed a $0 developer plan and a paid Plus plan. We imported the Python package locally and did not call a model.",
    categories: ["agent-frameworks"],
    toolTypes: ["framework"],
    platforms: ["cli", "self_host"],
    pricingModel: ["freemium"],
    bestFor: [
      "Developers composing agent workflows in code",
      "Teams that want run traces via LangSmith",
    ],
    notIdealFor: [
      "People who want only a visual builder",
      "A finished consumer chat product",
    ],
  },
  llamaindex: {
    shortDescription:
      "Open-source framework for retrieval and agents over your own data. Cloud free tier unconfirmed.",
    longDescription:
      "LlamaIndex is aimed at retrieval over your own data, with agent utilities on top of the core library. We installed and imported llama-index-core. The pricing page loaded, but the crawl did not clearly show a free cloud tier, so that part stays unconfirmed.",
    categories: ["agent-frameworks", "search-rag"],
    toolTypes: ["framework"],
    platforms: ["cli", "self_host"],
    pricingModel: [],
    bestFor: [
      "RAG pipelines over documents you already have",
      "Python teams building retrieval into an agent",
    ],
    notIdealFor: [
      "A finished consumer chat app",
      "Anyone who needs a confirmed free cloud tier from this check",
    ],
  },
  dify: {
    shortDescription:
      "Open-source platform to build agent workflows visually, with a self-hosted community edition.",
    longDescription:
      "Dify is a visual platform for agent workflows, with a self-hosted community edition called out on the pricing page. We checked the site, docs, and pricing. We did not install it. Cloud price samples in the page text should be re-read on the live pricing page before you rely on them.",
    categories: ["agent-frameworks"],
    toolTypes: ["framework", "agent"],
    platforms: ["web", "self_host"],
    pricingModel: ["freemium", "enterprise"],
    bestFor: [
      "Teams who want a visual agent builder they can self-host",
      "Projects that need a product UI, not only a library",
    ],
    notIdealFor: [
      "A small Python script with no surrounding app",
      "Hands-on proof from us — this one is docs checked only",
    ],
  },
  flowise: {
    shortDescription:
      "Open-source, low-code builder for LLM flows you can self-host. Cloud free tier was not clearly confirmed.",
    longDescription:
      "Flowise is a low-code builder for LLM flows. The npm package and GitHub repo are the open-source path we could confirm. The pricing page came back thin in our crawl, so a cloud free tier is not confirmed. We did not install it.",
    categories: ["agent-frameworks"],
    toolTypes: ["framework"],
    platforms: ["web", "self_host"],
    pricingModel: [],
    bestFor: [
      "Visual flows on infrastructure you run yourself",
      "Teams already comfortable with a Node service",
    ],
    notIdealFor: [
      "A confirmed free hosted plan — we could not verify one",
      "Code-first agent libraries, if that is all you need",
    ],
  },
  autogen: {
    shortDescription:
      "Microsoft open-source Python library for multi-agent conversations. Newest release we found is from 2025.",
    longDescription:
      "AutoGen (the microsoft/autogen Python library) is a multi-agent framework. We installed autogen-agentchat and imported it, with no model call. The latest Python GitHub release we found, python-v0.7.5, was published on September 30, 2025 — older than the other frameworks in this check. Treat freshness as an open question, not a verdict.",
    categories: ["agent-frameworks"],
    toolTypes: ["framework", "agent"],
    platforms: ["cli", "self_host"],
    pricingModel: ["free"],
    bestFor: [
      "Python experiments with multi-agent conversations",
      "Teams that want an open-source library with no product paywall",
    ],
    notIdealFor: [
      "A frequently updated hosted product",
      "Anyone who needs a 2026 release cadence — we did not find one",
    ],
  },
  cursor: {
    shortDescription:
      "Desktop IDE with an agent that can edit, run, and review code. Docs and pricing checked; not installed here.",
    longDescription:
      "Cursor is a desktop IDE whose agent edits and reviews code. We opened the site, docs, and pricing page. The pricing page showed a $0 tier next to paid plans. We did not install the app or sign in, so this listing is docs checked, not smoke-tested.",
    categories: ["coding-agents"],
    toolTypes: ["copilot", "agent"],
    platforms: ["ide", "desktop"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Developers who want an agent inside the editor",
      "Day-to-day coding where the agent should touch the repo",
    ],
    notIdealFor: [
      "A headless library you import from Python",
      "A hands-on install check — we did not run one",
    ],
  },
  claude: {
    shortDescription:
      "Anthropic Claude product and API for chat and coding. Docs checked; we did not sign up.",
    longDescription:
      "Claude is Anthropic’s model product, used for chat and coding. The URL we checked redirected toward the Claude product overview. The pricing page included a $0 option in the text we could read; API billing is separate. We did not create an account.",
    categories: ["coding-agents"],
    toolTypes: ["model_api", "agent"],
    platforms: ["web"],
    pricingModel: ["freemium", "usage", "subscription"],
    bestFor: [
      "Chat and coding help through Claude’s product or API",
      "Teams already comparing model providers",
    ],
    notIdealFor: [
      "A self-hosted open-source agent runtime",
      "Anyone who needs a local install from this check",
    ],
  },
  continue: {
    shortDescription:
      "Open-source coding agent and IDE extension. The /pricing URL returned 404 on our check.",
    longDescription:
      "Continue is an open-source coding agent that runs as an IDE extension. We checked the homepage, docs, and GitHub releases. continue.dev/pricing returned HTTP 404, so there is no separate pricing page in this listing — the open-source extension is the free path we could confirm. We did not install the extension.",
    categories: ["coding-agents"],
    toolTypes: ["copilot"],
    platforms: ["ide"],
    pricingModel: [],
    bestFor: [
      "Developers who want an open-source copilot in the IDE",
      "Teams that would rather extend the editor they already use",
    ],
    notIdealFor: [
      "A hosted IDE with a published price grid",
      "A confirmed cloud plan — the pricing URL 404’d",
    ],
  },
  replit: {
    shortDescription:
      "Browser IDE with a coding agent. Homepage and pricing returned HTTP 403, so this listing is not fully checked.",
    longDescription:
      "Replit is a browser IDE with a coding agent. From this environment the homepage and pricing URL returned HTTP 403, while the docs root returned HTTP 200. We could not confirm a free tier. The listing stays untested until someone re-checks it in a normal browser. A 403 to our client is not proof the site is down.",
    categories: ["coding-agents"],
    toolTypes: ["copilot", "agent"],
    platforms: ["web", "ide"],
    pricingModel: [],
    bestFor: [
      "Coding in the browser, once you confirm the current product yourself",
    ],
    notIdealFor: [
      "Anyone relying on this card as a completed check",
      "A self-hosted agent framework",
    ],
  },
  autogpt: {
    shortDescription:
      "Open-source agent project with a platform beta. Site and repo checked; local install not run.",
    longDescription:
      "AutoGPT is an open-source agent project. We checked the GitHub repo and agpt.co/pricing. A platform beta release was published on October 14, 2026. We did not install it locally. The repo is the free path; hosted plans may be paid.",
    categories: ["agent-frameworks", "coding-agents"],
    toolTypes: ["agent"],
    platforms: ["self_host", "web"],
    pricingModel: [],
    bestFor: [
      "Reading an open-source autonomous-agent codebase",
      "Teams watching the platform beta releases",
    ],
    notIdealFor: [
      "A tiny script where a smaller library is enough",
      "A hands-on install — we did not run one",
    ],
  },
  browser_use: {
    shortDescription:
      "Open-source Python agent that controls a browser. We imported the package locally; no model call.",
    longDescription:
      "Browser Use is a Python agent for driving a browser. We installed browser-use and imported Agent. We did not sign up, pay, or call a model. Docs mention separately billed cloud browsers; local use still needs your own browser and model keys.",
    categories: ["tool-use"],
    toolTypes: ["agent"],
    platforms: ["cli", "self_host"],
    pricingModel: ["usage"],
    bestFor: [
      "Agents that need to open pages, click, and type",
      "Python projects that can bring their own browser and model",
    ],
    notIdealFor: [
      "Jobs that only need an HTTP search API",
      "A no-code hosted agent with no local setup",
    ],
  },
  composio: {
    shortDescription:
      "Connects agents to third-party apps and tools. Docs and a $0 Hobby plan were checked; not installed here.",
    longDescription:
      "Composio is a tool-use layer between agents and third-party apps. The pricing page we crawled included Hobby / $0 / no-credit-card language. We checked docs and the October 15, 2026 CLI release, and we did not install it or create an account.",
    categories: ["tool-use"],
    toolTypes: ["infra"],
    platforms: ["web", "cli"],
    pricingModel: ["freemium"],
    bestFor: [
      "Agents that need many SaaS tools without custom OAuth for each one",
      "Teams evaluating a hosted tool layer with an open-source SDK",
    ],
    notIdealFor: [
      "A single API you already call directly",
      "A local hands-on test — we did not run one",
    ],
  },
  tavily: {
    shortDescription:
      "Search API for agents that need web results. Pricing page showed a $0 option; not installed here.",
    longDescription:
      "Tavily is a search API meant for agents. The pricing crawl included $0 and no-credit-card language, plus paid usage samples. Confirm the current free allotment on the pricing page. We did not call the API.",
    categories: ["tool-use", "search-rag"],
    toolTypes: ["infra"],
    platforms: ["web"],
    pricingModel: ["freemium", "usage"],
    bestFor: [
      "Agent retrieval that starts with web search",
      "Apps that want search results, not a full browser",
    ],
    notIdealFor: [
      "Crawling your own site into a corpus",
      "Interactive clicking and logged-in browsing",
    ],
  },
  firecrawl: {
    shortDescription:
      "Turns websites into markdown for LLMs. Open-source repo plus a cloud API with a free plan.",
    longDescription:
      "Firecrawl crawls pages into markdown for language models. We checked the site, pricing, docs, and the GitHub release. The pricing crawl mentioned a free or hobby plan and a $0 sample, with paid tiers above that. We did not run a local install.",
    categories: ["tool-use", "search-rag"],
    toolTypes: ["infra"],
    platforms: ["web", "self_host"],
    pricingModel: ["freemium", "usage"],
    bestFor: [
      "Turning pages into clean text for retrieval",
      "Teams that want either a cloud API or an open-source repo",
    ],
    notIdealFor: [
      "Interactive browser tasks such as clicking and login flows",
      "A general web-search API — that is a different job",
    ],
  },
  n8n: {
    shortDescription:
      "Workflow automation you can self-host for free, or use n8n Cloud on a paid plan. Our local npm install failed.",
    longDescription:
      "n8n automates workflows across apps, including agent-style steps. Community Edition is the free self-host path. n8n Cloud’s Starter plan was listed at 20€/month on annual billing, with a card-free trial rather than a permanent free cloud tier. We tried `npm install n8n@2.43.6` and it failed in this environment (node-gyp / distutils). Registry, docs, and pricing were still checked, so the status stays docs checked.",
    categories: ["workflow-automation"],
    toolTypes: ["automation"],
    platforms: ["web", "self_host"],
    pricingModel: ["subscription"],
    bestFor: [
      "Automations you can self-host",
      "Multi-step workflows across apps you already use",
    ],
    notIdealFor: [
      "A one-import Python agent library",
      "A permanent free cloud plan — we did not find one",
    ],
  },
  zapier: {
    shortDescription:
      "Connects the apps you already use. Pricing page loaded, but a free task tier was not clearly confirmed.",
    longDescription:
      "Zapier connects SaaS apps, including agent-style steps. The pricing page returned HTTP 200, but the text we extracted did not clearly show the free task tier, so that detail stays unconfirmed. We did not create an account.",
    categories: ["workflow-automation"],
    toolTypes: ["automation"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Connecting hosted apps without running a server",
      "Teams that already live in Zapier’s app directory",
    ],
    notIdealFor: [
      "Self-hosted or offline workflows",
      "A confirmed free-tier claim from this check",
    ],
  },
  make: {
    shortDescription:
      "Visual automation across apps. The pricing FAQ we fetched describes a free plan with 1,000 credits a month.",
    longDescription:
      "Make is a visual automation product. A direct HTML crawl of pricing sometimes returned 403; a fetch of the official pricing FAQ did describe a Free plan with 1,000 credits per month. Paid Core, Pro, and Teams plans sit above that. We did not create an account.",
    categories: ["workflow-automation"],
    toolTypes: ["automation"],
    platforms: ["web"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Visual multi-step automations",
      "Teams that want a hosted builder rather than a library",
    ],
    notIdealFor: [
      "Code-first agent frameworks",
      "Self-hosting the automation engine",
    ],
  },
  perplexity: {
    shortDescription:
      "Web research product. Homepage returned HTTP 403 to our checker, so this listing is not fully checked.",
    longDescription:
      "Perplexity answers questions from the web. The homepage returned HTTP 403 to our client. Docs were reachable, but we could not cleanly confirm a consumer Free versus Pro split. This listing is untested. A 403 here is an environment limit, not proof a browser cannot open the site.",
    categories: ["search-rag"],
    toolTypes: ["other"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Web research, once you confirm the current plan in a browser",
    ],
    notIdealFor: [
      "Anyone treating this card as a finished verification",
      "A self-hosted crawler or vector database",
    ],
  },
  pinecone: {
    shortDescription:
      "Managed vector database for retrieval. A true $0 tier was not clearly confirmed on the pricing page.",
    longDescription:
      "Pinecone is a managed vector database used in retrieval stacks. The pricing crawl mentioned Starter and paid monthly samples. A true $0 free tier was not clearly confirmed, so it stays unconfirmed. We did not create an account.",
    categories: ["search-rag"],
    toolTypes: ["infra"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Hosted vector search inside a RAG stack",
      "Teams that do not want to run the database themselves",
    ],
    notIdealFor: [
      "A confirmed free tier from this check",
      "Web search or page crawling — different tools",
    ],
  },
  mem0: {
    shortDescription:
      "Memory layer for agents. We imported the Python package locally; no account and no model call.",
    longDescription:
      "Mem0 stores memory for agents. We installed mem0ai and imported it, with no API key and no model call. The cloud pricing page loaded; a free SaaS tier was not cleanly parsed, so the confirmed free path from this check is the open-source package.",
    categories: ["search-rag"],
    toolTypes: ["infra"],
    platforms: ["cli", "self_host", "web"],
    pricingModel: [],
    bestFor: [
      "Adding persistent memory to an agent you already run",
      "Python projects that can install the open-source package",
    ],
    notIdealFor: [
      "A full research chat product",
      "A confirmed free cloud allotment — re-read the pricing page",
    ],
  },
  bitpart: {
    shortDescription:
      "NPC engine for games, with SDKs described on the product page. No public price grid found on our check.",
    longDescription:
      "Bitpart builds NPCs for games. The product page describes SDKs. We did not find a public pricing grid, so price and free tier are unconfirmed — do not assume a number. We did not install an SDK.",
    categories: ["game-ai"],
    toolTypes: ["agent"],
    platforms: ["web"],
    pricingModel: ["contact"],
    bestFor: [
      "Game teams evaluating an NPC engine with SDKs",
      "Projects that can talk to the vendor about price",
    ],
    notIdealFor: [
      "A published self-serve price",
      "A docs-complete install guide — docs URL is the product site",
    ],
  },
  mistscale: {
    shortDescription:
      "Memory for game NPCs. Homepage checked; a dedicated /docs URL returned 404 once.",
    longDescription:
      "MistScale is aimed at memory for game NPCs. Homepage copy we had already seen talks about trying it without a card; reconfirm that on the live page. mistscale.com/docs returned 404 in one check, and we did not find a separate pricing URL. We did not create an account.",
    categories: ["game-ai"],
    toolTypes: ["infra"],
    platforms: ["web"],
    pricingModel: ["freemium"],
    bestFor: [
      "NPCs that need to remember the player",
      "Teams comparing memory products rather than full character stacks",
    ],
    notIdealFor: [
      "A standalone art or voice tool",
      "Deep public docs — the docs path 404’d in this check",
    ],
  },
  nvidia_ace: {
    shortDescription:
      "NVIDIA ACE toolkit for in-game characters, including developer downloads. Not a simple SaaS signup.",
    longDescription:
      "NVIDIA ACE for Games is a developer toolkit for in-game characters. The page we read describes downloads and plugins; Unreal plugins were noted as MIT-licensed in that earlier read. It is not a simple hosted free tier — it assumes NVIDIA developer access and hardware. We did not install the SDK. Open-source status for the whole product was not recorded as a yes or no.",
    categories: ["game-ai"],
    toolTypes: ["agent"],
    platforms: ["unreal"],
    pricingModel: ["free"],
    bestFor: [
      "Game teams already on NVIDIA’s developer stack",
      "In-game characters where a local or OEM runtime matters",
    ],
    notIdealFor: [
      "A five-minute SaaS signup with a public price grid",
      "Discord bots or non-game chat",
    ],
  },
  inworld: {
    shortDescription:
      "Character AI for games and interactive agents. Pricing page included a $0 sample; not hands-on tested.",
    longDescription:
      "Inworld builds character AI for games and interactive experiences. The pricing crawl included a $0 sample among paid usage samples. Confirm the current free allotment on the pricing page. We checked docs and did not run a hands-on session.",
    categories: ["game-ai"],
    toolTypes: ["agent"],
    platforms: ["web"],
    pricingModel: ["freemium"],
    bestFor: [
      "Game characters with dialogue",
      "Teams that want a hosted character stack and docs",
    ],
    notIdealFor: [
      "A local Python library we smoke-tested — we did not",
      "Image or 3D asset generation",
    ],
  },
  convai: {
    shortDescription:
      "Conversational characters for games. Site loaded; pricing text did not come through, so the free tier is unconfirmed.",
    longDescription:
      "Convai makes conversational characters for games. The homepage returned HTTP 200. The pricing URL did not yield readable plan text in this environment, so the free tier is unconfirmed. We did not create an account.",
    categories: ["game-ai"],
    toolTypes: ["agent"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "In-game characters that talk with the player",
      "Teams comparing hosted NPC platforms",
    ],
    notIdealFor: [
      "A confirmed price or free tier from this check",
      "Workflow automation outside a game",
    ],
  },
  modl: {
    shortDescription:
      "Game AI tools. Homepage loaded; /pricing returned 404, so pricing is unconfirmed.",
    longDescription:
      "modl.ai is a game AI product. The homepage returned HTTP 200 and /pricing returned 404, so we do not have a public price. Free tier is unconfirmed. We did not create an account.",
    categories: ["game-ai"],
    toolTypes: ["other"],
    platforms: ["web"],
    pricingModel: ["contact"],
    bestFor: ["Game teams looking up modl.ai’s current product page"],
    notIdealFor: [
      "A self-serve price comparison",
      "A smoke-tested install",
    ],
  },
  tavernbard: {
    shortDescription:
      "AI game master for Discord. Homepage describes a free path that uses your own AI subscription.",
    longDescription:
      "Tavernbard is an AI game master aimed at Discord. The homepage described a free play path that uses your own AI subscription. A $49.99 sample also appeared in the crawl; confirm what is free versus paid on the live site. /pricing returned 404. We did not join a server or create an account.",
    categories: ["game-ai"],
    toolTypes: ["agent"],
    platforms: ["discord", "web"],
    pricingModel: ["freemium"],
    bestFor: [
      "Tabletop-style games run in Discord",
      "Groups that already pay for a model subscription",
    ],
    notIdealFor: [
      "In-engine NPCs inside Unity or Unreal",
      "A dedicated pricing page — that URL 404’d",
    ],
  },
  midjourney: {
    shortDescription:
      "Image generation. Official plans we read are paid subscriptions, with no free tier on the comparison.",
    longDescription:
      "Midjourney generates images. The homepage often returns HTTP 403 to automated clients; the plan comparison we could read lists Basic $10, Standard $30, Pro $60, and Mega $120 per month, and no free plan. Those figures are from the October 15, 2026 docs article, not a guess — re-check the article before you quote them. We did not subscribe.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web", "discord"],
    pricingModel: ["subscription"],
    bestFor: [
      "Image generation when a paid subscription is acceptable",
      "Game concept art exploration",
    ],
    notIdealFor: [
      "A free tier — the official comparison we read does not list one",
      "3D models, voice, or video editing",
    ],
  },
  runway: {
    shortDescription:
      "Video generation and editing. Pricing page loaded; a free tier was not clearly confirmed.",
    longDescription:
      "Runway generates and edits video. The site resolved at runway.com (from the older runwayml.com host). The pricing page returned HTTP 200 with a lot of content, but a free tier was not cleanly extracted, so it stays unconfirmed. One fetch of the help center returned 403. We did not create an account.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Generating or editing video for a game or a stream",
      "Creators comparing hosted video tools",
    ],
    notIdealFor: [
      "A confirmed free plan from this check",
      "In-game NPC dialogue",
    ],
  },
  scenario: {
    shortDescription:
      "Game art generation. The pricing page we checked mentions a free plan.",
    longDescription:
      "Scenario generates art aimed at games. The pricing crawl mentioned a free tier or free plan, plus starter language and no-credit-card wording. Paid samples in that crawl included $15, $45, and $75 per month — confirm them on the live page. We did not create an account.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Game-specific image styles and asset sets",
      "Art pipelines that want a free plan to start",
    ],
    notIdealFor: [
      "3D mesh generation — see Meshy for that job",
      "A hands-on generation test — we did not run one",
    ],
  },
  meshy: {
    shortDescription:
      "Text and image to 3D assets. Pricing page showed a $0 option and no-card language.",
    longDescription:
      "Meshy turns text and images into 3D assets. The pricing crawl showed $0 and no-credit-card language, with a paid sample around $20 per month. Confirm inclusions on the pricing page. We did not create an account or generate a model.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Quick 3D assets for a game or prototype",
      "Creators who want a $0 way to try the product",
    ],
    notIdealFor: [
      "Final production modeling without an artist pass",
      "Voice, video, or NPC logic",
    ],
  },
  elevenlabs: {
    shortDescription:
      "Voice and audio generation. Pricing page loaded, but the text was too thin to confirm a free tier.",
    longDescription:
      "ElevenLabs generates voice and audio. The pricing page returned HTTP 200, but the extracted text was only a few hundred characters, so a free tier was not confirmed in this pass. Re-check elevenlabs.io/pricing in a browser before claiming a free plan. We did not create an account.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Voice for characters, trailers, or streams",
      "Teams comparing hosted speech tools",
    ],
    notIdealFor: [
      "A confirmed free-tier claim from this check",
      "Image or 3D generation",
    ],
  },
  descript: {
    shortDescription:
      "Edit video and audio by editing the transcript. Pricing page included a free-to-start option.",
    longDescription:
      "Descript edits audio and video from the transcript. The pricing crawl included free-to-start or hobby and $0 language, with paid samples in a roughly $16–$65 range. Confirm current limits on the pricing page. We did not install the app.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web", "desktop"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Cutting and cleaning talking-head or podcast video",
      "Creators who edit by editing words",
    ],
    notIdealFor: [
      "Generating a character voice from scratch as the main job",
      "In-game agents",
    ],
  },
  heygen: {
    shortDescription:
      "Avatar and spokesperson video. Pricing page showed a $0/mo option alongside paid plans.",
    longDescription:
      "HeyGen makes avatar and spokesperson videos. The pricing crawl included $0/month alongside $29 and $49 per month samples. Confirm what the free plan includes. We did not create an account.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Spokesperson or avatar videos",
      "Teams that want a hosted avatar tool with a $0 tier on the page we read",
    ],
    notIdealFor: [
      "Gameplay capture or VOD clipping",
      "A local open-source editor",
    ],
  },
  opus: {
    shortDescription:
      "Cuts long videos into short clips. A lasting free plan was not clearly separated from starter pricing.",
    longDescription:
      "Opus Clip turns long videos into short clips. The pricing crawl mentioned starter, no-credit-card language, and $15 samples. A lasting free plan was not clearly separated from a trial or starter tier, so the free tier stays unconfirmed. We did not upload a video.",
    categories: ["creative-media"],
    toolTypes: ["creative"],
    platforms: ["web"],
    pricingModel: [],
    bestFor: [
      "Cutting a stream VOD or long video into shorts",
      "Creators who want a hosted clipper",
    ],
    notIdealFor: [
      "A confirmed forever-free plan from this check",
      "Generating the original footage",
    ],
  },
  notion: {
    shortDescription:
      "Docs, wikis, and agents in a team workspace. Pricing page included a $0 plan.",
    longDescription:
      "Notion is a workspace for docs and wikis, with agent features in the product. The pricing crawl included $0 alongside $10 and $20. AI features may sit on paid plans — confirm which agent features are on Free. We did not create a workspace.",
    categories: ["knowledge"],
    toolTypes: ["other"],
    platforms: ["web"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Team docs that you also want to query",
      "Groups already writing in Notion",
    ],
    notIdealFor: [
      "Local-only notes with no account",
      "A dedicated meeting bot — see Granola for that job",
    ],
  },
  granola: {
    shortDescription:
      "Meeting notes that sit alongside your calls. Pricing page included a $0 plan.",
    longDescription:
      "Granola takes meeting notes. The pricing crawl included $0 alongside $14 and $35. Confirm free-plan limits on the pricing page. We did not install the app or join a call.",
    categories: ["knowledge"],
    toolTypes: ["other"],
    platforms: ["desktop"],
    pricingModel: ["freemium", "subscription"],
    bestFor: [
      "Notes during meetings you are already in",
      "People who want a desktop notepad more than a wiki",
    ],
    notIdealFor: [
      "A team wiki or long-term knowledge base",
      "Game or stream production",
    ],
  },
  obsidian: {
    shortDescription:
      "Local-first notes app. Official pricing says the app is free without limits; Sync and Publish are paid.",
    longDescription:
      "Obsidian is a local-first notes app. The official pricing page says the app is free without limits and does not require a sign-up. Sync and Publish are paid add-ons ($4 and $8 per month billed annually on the page we read). Catalyst is a $25 one-time option, and a commercial license was listed at $50 per user per year. We did not install the app.",
    categories: ["knowledge"],
    toolTypes: ["other"],
    platforms: ["desktop"],
    pricingModel: ["free", "subscription"],
    bestFor: [
      "Personal or team notes that live in local files",
      "People who want the app itself without a subscription",
    ],
    notIdealFor: [
      "Hosted meeting transcription",
      "A multiplayer wiki with no local files",
    ],
  },
};

const useCases = [
  {
    slug: "multi-agent-workflows",
    title: "Build multi-agent workflows",
    summary: "Crews, graphs, and orchestrators for multi-step work.",
    audienceHints: ["builders"],
    matchTags: ["multi-agent-workflows"],
    recommended: [
      {
        toolId: "crewai",
        why: "Role-based crews in Python. We installed the package and imported it on October 15, 2026 — no API key and no model call.",
      },
      {
        toolId: "langchain",
        why: "Libraries for agents and tool calling. Local import checked the same day. LangSmith tracing is a separate product on the pricing page.",
      },
      {
        toolId: "autogen",
        why: "Microsoft’s multi-agent Python library. We imported it locally. The newest Python release we found was September 30, 2025.",
      },
      {
        toolId: "dify",
        why: "A visual builder with a self-hosted community edition. Site, docs, and pricing were checked; we did not install it.",
      },
    ],
  },
  {
    slug: "coding-agents",
    title: "Code with an AI agent",
    summary: "IDE agents and copilots that edit, run, and review code.",
    audienceHints: ["builders"],
    matchTags: ["coding-agents"],
    recommended: [
      {
        toolId: "cursor",
        why: "A desktop IDE whose agent edits and reviews code. Docs and pricing checked, including a $0 tier on the page. Not installed here.",
      },
      {
        toolId: "continue",
        why: "Open-source IDE extension. Homepage and docs checked. The dedicated pricing URL returned 404.",
      },
      {
        toolId: "claude",
        why: "Anthropic’s Claude product and API, including coding workflows. Docs checked; we did not sign up.",
      },
    ],
  },
  {
    slug: "tool-use-browser",
    title: "Give agents tools & browsers",
    summary: "Connect apps, MCP-style tool use, and browser control.",
    audienceHints: ["builders"],
    matchTags: ["tool-use-browser"],
    recommended: [
      {
        toolId: "browser_use",
        why: "Python agent that drives a browser. We imported the package locally on October 15, 2026, with no model call.",
      },
      {
        toolId: "composio",
        why: "Tool layer for third-party apps. Pricing page included a $0 Hobby plan. Not installed here.",
      },
      {
        toolId: "firecrawl",
        why: "Crawl pages into markdown for a model. Docs and a free-plan mention were checked.",
      },
      {
        toolId: "tavily",
        why: "Search API for agents. Pricing page showed a $0 option. We did not call the API.",
      },
    ],
  },
  {
    slug: "workflow-automation",
    title: "Automate business workflows",
    summary: "Agents and automations across the apps you already use.",
    audienceHints: ["builders"],
    matchTags: ["workflow-automation"],
    recommended: [
      {
        toolId: "n8n",
        why: "Self-host Community Edition for free, or use paid n8n Cloud. Our local npm install failed; docs and pricing were checked.",
      },
      {
        toolId: "make",
        why: "Visual automations. The pricing FAQ we fetched describes a free plan with 1,000 credits a month.",
      },
      {
        toolId: "zapier",
        why: "Connects hosted apps. The pricing page loaded, but a free task tier was not clearly confirmed.",
      },
    ],
  },
  {
    slug: "research-rag",
    title: "Research & retrieve the web",
    summary: "Search, crawl, and cite for agent retrieval.",
    audienceHints: ["builders"],
    matchTags: ["research-rag"],
    recommended: [
      {
        toolId: "tavily",
        why: "Web search built for agents, with a $0 option on the pricing page we read.",
      },
      {
        toolId: "firecrawl",
        why: "Turns sites into markdown you can index. Open-source repo plus a cloud free-plan mention.",
      },
      {
        toolId: "mem0",
        why: "Memory for agents. We imported the Python package locally; no account and no model call.",
      },
      {
        toolId: "llamaindex",
        why: "Framework for retrieval over your data. Local import checked. Cloud free tier unconfirmed.",
      },
      {
        toolId: "pinecone",
        why: "Managed vector database. Pricing page checked; a true $0 tier was not clearly confirmed.",
      },
    ],
  },
  {
    slug: "game-npcs",
    title: "Game NPCs & in-game agents",
    summary:
      "Characters and agents that live in a game engine or in Discord.",
    audienceHints: ["gamers", "builders"],
    matchTags: ["game-npcs"],
    recommended: [
      {
        toolId: "inworld",
        why: "Character AI for games. Pricing page included a $0 sample. Docs checked, not hands-on.",
      },
      {
        toolId: "convai",
        why: "Conversational game characters. Site loaded; pricing text did not, so the free tier is unconfirmed.",
      },
      {
        toolId: "nvidia_ace",
        why: "NVIDIA’s in-game character toolkit, with developer downloads rather than a simple SaaS grid.",
      },
      {
        toolId: "mistscale",
        why: "Memory so NPCs can remember the player. Homepage checked; /docs returned 404 once.",
      },
      {
        toolId: "tavernbard",
        why: "AI game master for Discord, with a free path that uses your own model subscription.",
      },
    ],
  },
  {
    slug: "game-creative",
    title: "Create for games & streams",
    summary: "Art, 3D, voice, and video for makers and creators.",
    audienceHints: ["gamers", "creators"],
    matchTags: ["game-creative", "creator-video-audio"],
    recommended: [
      {
        toolId: "scenario",
        why: "Game art. The pricing page we checked mentions a free plan.",
      },
      {
        toolId: "meshy",
        why: "3D assets from text or images. Pricing page showed a $0 option.",
      },
      {
        toolId: "elevenlabs",
        why: "Voice. Pricing page loaded, but the extract was too thin to confirm a free tier.",
      },
      {
        toolId: "runway",
        why: "Video generation and editing. Pricing page loaded; free tier unconfirmed.",
      },
      {
        toolId: "opus",
        why: "Short clips from a long video — the stream-VOD job. A lasting free plan was not clearly confirmed.",
      },
    ],
  },
  {
    slug: "meetings-knowledge",
    title: "Meetings, notes & knowledge",
    summary: "Capture, summarize, and query your team’s context.",
    audienceHints: ["builders"],
    matchTags: ["meetings-knowledge"],
    recommended: [
      {
        toolId: "notion",
        why: "Team docs and wikis, with agent features. Pricing page included a $0 plan.",
      },
      {
        toolId: "granola",
        why: "Meeting notes. Pricing page included a $0 plan. Not installed here.",
      },
      {
        toolId: "obsidian",
        why: "Local-first notes. The app is free without limits on the official pricing page; Sync and Publish are paid.",
      },
    ],
  },
];

const categories = [
  {
    slug: "agent-frameworks",
    title: "Agent frameworks & orchestration",
    summary: "Libraries and platforms for multi-step and multi-agent work.",
  },
  {
    slug: "coding-agents",
    title: "Coding agents & copilots",
    summary: "IDE agents and copilots that edit, run, and review code.",
  },
  {
    slug: "tool-use",
    title: "Tool use, MCP & browser agents",
    summary: "Connect apps, tools, and browser control.",
  },
  {
    slug: "workflow-automation",
    title: "Workflow automation",
    summary: "Automations across the apps you already use.",
  },
  {
    slug: "search-rag",
    title: "Search, crawl & RAG infra",
    summary: "Search, crawl, memory, and vector infrastructure.",
  },
  {
    slug: "game-ai",
    title: "Game AI & NPCs",
    summary: "Characters and agents for games and Discord.",
  },
  {
    slug: "creative-media",
    title: "Creative media (image, video, audio, 3D)",
    summary: "Art, 3D, voice, and video for makers and creators.",
  },
  {
    slug: "knowledge",
    title: "Knowledge, notes & meetings",
    summary: "Capture, summarize, and query team context.",
  },
];

const site = {
  name: "PickMyAgent",
  url: "https://pickmyagent.ai",
  catalogCheckedDate: "2026-10-15",
  newThisWeekSince: "2026-10-08",
  recentReleaseSince: "2026-10-01",
  methodologyVersion: smoke.methodologyVersion,
  tagline: "Find the AI agent (or tool) that fits the job.",
};

function cleanUrl(url) {
  if (!url) return null;
  return String(url).replace(/([^:]\/)\/+/g, "$1");
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const smokeIds = new Set(smoke.tools.map((tool) => tool.id));
for (const id of Object.keys(editorial)) {
  if (!smokeIds.has(id)) {
    throw new Error(`Editorial id ${id} is not in the smoke-test export`);
  }
}
for (const tool of smoke.tools) {
  if (!editorial[tool.id]) {
    throw new Error(`Missing editorial fields for ${tool.id}`);
  }
}

const toolsDir = path.join(root, "content/tools");
fs.rmSync(toolsDir, { recursive: true, force: true });

for (const source of smoke.tools) {
  const extra = editorial[source.id];
  if (extra.shortDescription.length > 160) {
    throw new Error(
      `${source.id} shortDescription is ${extra.shortDescription.length} chars`,
    );
  }
  const repoUrl = source.latestRelease?.repo
    ? `https://github.com/${source.latestRelease.repo}`
    : null;
  const latestRelease = source.latestRelease
    ? {
        repo: source.latestRelease.repo,
        tag: source.latestRelease.tag,
        name: source.latestRelease.name,
        publishedAt: source.latestRelease.published_at,
        url: source.latestRelease.html_url,
      }
    : null;
  const sources = [
    ...new Set(
      [source.websiteUrl, source.pricingUrl, source.docsUrl, latestRelease?.url]
        .filter(Boolean)
        .map(cleanUrl),
    ),
  ];
  const tool = {
    id: source.id,
    slug: source.id.replaceAll("_", "-"),
    name: source.name,
    websiteUrl: cleanUrl(source.websiteUrl),
    affiliateUrl: null,
    shortDescription: extra.shortDescription,
    longDescription: extra.longDescription,
    categories: extra.categories,
    useCaseTags: source.useCaseTags,
    toolTypes: extra.toolTypes,
    platforms: extra.platforms,
    pricingModel:
      source.openSource === true && !extra.pricingModel.includes("open_source")
        ? ["open_source", ...extra.pricingModel]
        : extra.pricingModel,
    pricingNotes: source.pricingNotes ?? null,
    pricingUrl: cleanUrl(source.pricingUrl),
    docsUrl: cleanUrl(source.docsUrl),
    freeTier: source.freeTier,
    freeTierNotes: source.freeTierNotes ?? null,
    openSource: source.openSource,
    repoUrl,
    bestFor: extra.bestFor,
    notIdealFor: extra.notIdealFor,
    smokeStatus: source.smokeStatus,
    smokeTested: source.smokeStatus === "tested-hands-on",
    checkedAt: source.checkedAt,
    checkedDate: source.checkedDate,
    smokeTestNotes: source.notes ?? null,
    handsOn: source.handsOn,
    latestRelease,
    problems: source.problems ?? [],
    featured: false,
    featuredPaid: false,
    status: "published",
    publishedAt: source.checkedDate,
    updatedAt: source.checkedDate,
    sources,
    siteLoad: {
      status: source.siteLoad.status,
      finalUrl: source.siteLoad.final,
    },
  };
  writeJson(path.join(toolsDir, `${tool.slug}.json`), tool);
}

const useCasesDir = path.join(root, "content/use-cases");
fs.rmSync(useCasesDir, { recursive: true, force: true });
for (const useCase of useCases) {
  writeJson(path.join(useCasesDir, `${useCase.slug}.json`), useCase);
}

writeJson(path.join(root, "content/categories.json"), categories);
writeJson(path.join(root, "content/site.json"), site);

const assemble = spawnSync(process.execPath, ["scripts/assemble-catalog.mjs"], {
  cwd: root,
  stdio: "inherit",
});
if (assemble.status !== 0) {
  process.exit(assemble.status ?? 1);
}

console.log(
  `Wrote ${smoke.tools.length} tools, ${useCases.length} use cases.`,
);

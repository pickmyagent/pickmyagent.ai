#!/usr/bin/env python3
"""Fill capabilities from each tool's existing listing copy. No new product claims."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "content" / "tools"

# (required words that must already appear in the listing, capability)
PATTERNS = [
    (["floor", "plan", "render"], "turn a floor plan into a render"),
    (["floor", "plan", "photo"], "turn a floor plan photo into an image"),
    (["floor", "plan", "sketch"], "turn a sketch of a floor plan into an image"),
    (["blueprint", "render"], "turn a blueprint into a render"),
    (["blueprint", "image"], "make an image from a blueprint"),
    (["elevation", "render"], "render an elevation from a plan"),
    (["room", "photo", "redesign"], "redesign a room from a photo"),
    (["room", "photo"], "restyle a room from a photo"),
    (["virtual", "staging"], "virtually stage a listing photo"),
    (["listing", "photo"], "edit a listing photo"),
    (["listing", "video"], "make a listing video from photos"),
    (["listing", "description"], "draft a listing description"),
    (["mls"], "draft mls remarks from listing facts"),
    (["inbox", "email"], "triage an email inbox"),
    (["inbox"], "sort an inbox and draft a reply"),
    (["calendar"], "plan tasks on a calendar"),
    (["meeting", "notes"], "take notes in a meeting"),
    (["transcript"], "turn a transcript into notes"),
    (["invoice"], "capture an invoice for accounts payable"),
    (["quickbooks"], "clean up transactions in quickbooks"),
    (["reconcile"], "reconcile bookkeeping transactions"),
    (["receipt"], "categorize a receipt in the books"),
    (["tax", "return"], "prepare a tax return from your forms"),
    (["deduction"], "sort deductions before a tax return"),
    (["1040"], "file a personal 1040 return"),
    (["portfolio"], "track an investment portfolio"),
    (["brokerage"], "link a brokerage account for a portfolio view"),
    (["candidate"], "screen a candidate for a role"),
    (["resume"], "draft resume bullets for a role"),
    (["interview"], "take notes in a candidate interview"),
    (["support", "ticket"], "answer a customer support ticket"),
    (["refund"], "handle a refund request in support"),
    (["phishing"], "review a phishing email"),
    (["alert"], "triage a security alert"),
    (["password"], "reset a password from an it ticket"),
    (["help", "desk"], "take an it help desk ticket"),
    (["pull", "request"], "review a pull request"),
    (["code"], "edit code with an assistant in the editor"),
    (["browser"], "open pages and click in a browser"),
    (["workflow"], "automate a workflow across apps"),
    (["npc"], "build a game npc with dialogue"),
    (["voice"], "generate speech from text"),
    (["image", "prompt"], "generate an image from a prompt"),
    (["video", "prompt"], "generate a video from a prompt"),
    (["3d"], "make a 3d model from a prompt or photo"),
    (["literature"], "gather papers for a literature review"),
    (["tutor"], "tutor a learner through a problem"),
    (["homework"], "explain a homework step"),
    (["itinerary"], "draft a trip itinerary"),
    (["flight"], "compare flights for a trip"),
    (["parcel"], "look up a parcel on a map"),
    (["zoning"], "check zoning on a parcel"),
    (["acre"], "search acreage and parcel records"),
    (["fsbo"], "find for sale by owner leads"),
    (["off-market"], "find off-market property leads"),
    (["off", "market"], "find off-market property leads"),
    (["skip"], "skip trace a property owner"),
    (["social", "post"], "draft and schedule a social post"),
    (["instagram"], "draft an instagram caption"),
    (["seo"], "draft an seo article"),
    (["blog"], "draft a blog post"),
    (["newsletter"], "draft an email newsletter"),
    (["spreadsheet"], "ask questions about a spreadsheet"),
    (["dashboard"], "build a dashboard from a dataset"),
    (["knowledge"], "answer a question from company documents"),
    (["wiki"], "answer a question from a wiki"),
    (["vector"], "store vectors for retrieval"),
    (["crawl"], "crawl pages for a search index"),
    (["memory"], "store memory an agent can read later"),
    (["agent", "crew"], "run a crew of agents on a task"),
    (["multi-agent"], "orchestrate a multi-agent workflow"),
    (["cold", "email"], "send a cold email sequence"),
    (["lead"], "research a sales lead before outreach"),
    (["payroll"], "run payroll for a team"),
    (["rent"], "track rent and a lease"),
    (["maintenance"], "track a maintenance request"),
    (["comp"], "pull comparable sales for a home"),
    (["cma"], "build a cma from comparable sales"),
    (["cap", "rate"], "rank a rental by cap rate"),
    (["cash", "flow"], "compare cash flow on a rental"),
    (["twitch"], "clip a twitch stream into a short"),
    (["highlight"], "cut a highlight reel from a stream"),
    (["avatar"], "make an avatar video from a script"),
    (["camera"], "generate a clip with a camera move"),
    (["shopping"], "compare products while you shop"),
    (["headphone"], "compare product prices"),
    (["language"], "practice a language conversation"),
    (["spanish"], "practice a spanish conversation"),
    (["game", "master"], "run a tabletop game in chat"),
    (["discord"], "run a discord game session"),
    (["bug"], "write a bug report for a game build"),
    (["contract"], "review a contract draft"),
    (["quote"], "draft a quote for a customer"),
    (["promotion"], "schedule a marketing promotion"),
    (["review"], "request a review from a customer"),
]

OVERRIDES = {
    "abnormal": [
        "flag a phishing email from behavior",
        "watch an account for takeover risk",
        "review misdirected email before it sends",
        "monitor identity risk in the inbox",
        "triage email threats for a security team",
    ],
    "charlotte-ai": [
        "investigate a security alert in crowdstrike",
        "summarize an incident for an analyst",
        "ask a question about the security stack",
        "speed up alert review for an analyst",
        "assist a cybersecurity analyst on a case",
    ],
    "chatgpt": [
        "draft text in a general chat",
        "compare options in a general chat",
        "research a question in a general chat",
        "rewrite a paragraph in a general chat",
        "outline steps in a general chat",
    ],
    "claude": [
        "draft text in a chat",
        "get coding help in a chat",
        "compare model providers for a task",
        "rewrite a document in a chat",
        "outline a coding change in a chat",
    ],
    "gemini": [
        "draft text inside google apps",
        "compare options in a general chat",
        "research a question in a general chat",
        "rewrite a paragraph in a chat",
        "outline a task in a general chat",
    ],
    "perplexity": [
        "answer a question from the web",
        "show linked sources for an answer",
        "research a topic with citations",
        "compare sources on a question",
        "look up a fact and keep the link",
    ],
    "deepseek": [
        "chat with a coding model",
        "call a model through an api",
        "draft code in a chat app",
        "ask a coding question in chat",
        "search the web from a chat answer",
    ],
    "d5-render": [
        "render a live 3d model",
        "export an image from a 3d view",
        "export a panorama from a 3d view",
        "export a video from a 3d view",
        "try ai visualization on a model",
    ],
    "daydream": [
        "chat to shop for fashion",
        "find clothing across many stores",
        "ask a fashion agent what to buy",
        "compare fashion products in chat",
        "shop more than one store from one chat",
    ],
    "decagon": [
        "answer customers in chat",
        "answer customers by email",
        "answer customers by voice",
        "run a support workflow for an agent",
        "handle a customer conversation across channels",
    ],
    "doorloop": [
        "collect rent from a tenant",
        "track a maintenance request",
        "manage a lease for a unit",
        "draft a listing for a rental",
        "summarize an inspection report",
    ],
    "dropzone": [
        "investigate a security alert end to end",
        "show the reasoning behind an alert",
        "hunt for a threat in the environment",
        "triage a soc alert",
        "explain an alert to an analyst",
    ],
    "duolingo-max": [
        "practice a language in a lesson",
        "role play a conversation in a language",
        "explain a mistake in a language lesson",
        "study with a chat inside the lesson",
        "keep practicing a language each day",
    ],
    "elicit": [
        "gather papers for a literature review",
        "ask a research question over papers",
        "export notes from a literature review",
        "screen papers for a review",
        "summarize findings from papers",
    ],
    "flyfin": [
        "find deductions for a freelancer",
        "organize self-employed expenses",
        "prepare a freelancer tax return",
        "hand a return to a cpa to file",
        "sort income for a self-employed return",
    ],
    "freshservice": [
        "open an it help desk ticket",
        "route an employee it request",
        "track an it incident to resolution",
        "run a service desk for it teams",
        "answer a common it request",
    ],
    "glean": [
        "search across company documents",
        "answer a question from company context",
        "connect workplace apps for search",
        "find a file across company tools",
        "ask an agent about internal documents",
    ],
    "granola": [
        "take notes during a meeting",
        "capture notes while you are on a call",
        "keep meeting notes on a free plan",
        "jot notes in a desktop notepad",
        "review notes after a meeting",
    ],
    "guru": [
        "answer a question from company cards",
        "improve a knowledge card over time",
        "search a company wiki",
        "verify an answer against company docs",
        "keep a knowledge base current",
    ],
    "hex": [
        "analyze data in a notebook",
        "ask a hex agent about a dataset",
        "build a dashboard from analysis",
        "query data with an editor on the team",
        "explore a dataset in a shared notebook",
    ],
    "homestyler": [
        "draw a 3d floor plan in the browser",
        "render a floor plan at 1k",
        "place furniture from a model library",
        "render a layout at higher resolution",
        "check a floor plan before you build",
    ],
    "intercom-fin": [
        "answer a customer support conversation",
        "resolve a support question in the inbox",
        "hand a hard case to a human agent",
        "run an ai agent on top of the inbox",
        "deflect a repeated support question",
    ],
    "julius": [
        "ask a question about a spreadsheet",
        "analyze a table in chat",
        "summarize a dataset for a teammate",
        "chart a column from a spreadsheet",
        "explore everyday data on a free plan",
    ],
    "lindy": [
        "triage an inbox with an assistant",
        "schedule meetings from an inbox",
        "draft outreach to a lead",
        "run a calendar task on credits",
        "hand a repeated chore to an assistant",
    ],
    "magnifi": [
        "link a brokerage account",
        "read a portfolio summary",
        "ask a question about a portfolio",
        "forecast a portfolio on a paid plan",
        "review account overview in one place",
    ],
    "mem0": [
        "store memory for an agent",
        "retrieve memory an agent saved earlier",
        "add persistent memory to an agent",
        "install an open-source memory library",
        "keep agent memory in a cloud plan",
    ],
    "modl": [
        "test an uploaded game build",
        "write a bug report with visuals",
        "score the severity of a game bug",
        "play through a build with an agent",
        "report bugs without an engine plugin",
    ],
    "motion": [
        "plan a calendar automatically",
        "schedule tasks around meetings",
        "block time for work on a calendar",
        "keep meetings and tasks in one app",
        "replan a day when a meeting moves",
    ],
    "moveworks": [
        "answer an employee it question",
        "route an it service request",
        "help an employee reset access",
        "support employee onboarding requests",
        "automate an itsm workflow",
    ],
    "nvidia-ace": [
        "drive an in-game character",
        "add a plugin for game characters",
        "download tools for in-game characters",
        "build a character on the nvidia stack",
        "prototype npc behavior for a game",
    ],
    "portfolio-pilot": [
        "track net worth across accounts",
        "assess a portfolio on a free plan",
        "line up investment accounts",
        "review a portfolio assessment",
        "see investing ideas on a paid plan",
    ],
    "range": [
        "ask an assistant about a financial plan",
        "join a flat-fee advisory membership",
        "review a household financial plan",
        "talk through goals with an advisor",
        "use an ai assistant inside the membership",
    ],
    "regrid": [
        "buy parcel boundaries for a county",
        "download owner fields for a state",
        "pull parcel geometry for a map",
        "query parcel data through an api",
        "standardize assessment fields for parcels",
    ],
    "roomgpt": [
        "turn one room photo into a new style",
        "preview a restyle before a renovation",
        "restyle a room from a single photo",
        "see a room in a different theme",
        "mock up an interior from one photo",
    ],
    "sierra": [
        "build a customer service agent",
        "answer customers with a voice agent",
        "design an agent for customer experience",
        "handle a support conversation with an agent",
        "deploy an agent for a customer team",
    ],
    "slite": [
        "ask a question over team docs",
        "search docs with an ai answer",
        "verify a doc before the team relies on it",
        "find an answer in a team wiki",
        "keep team documentation searchable",
    ],
    "spark-mail": [
        "draft an email reply",
        "sort a smart inbox",
        "snooze an email for later",
        "send an email later",
        "screen new senders in the inbox",
    ],
    "studyfetch": [
        "explain a subject from your materials",
        "build a study plan from course files",
        "make flashcards from course materials",
        "build practice from uploaded notes",
        "tutor a subject you are studying",
    ],
    "synthesis-tutor": [
        "tutor a child in k-5 math",
        "adapt a math lesson to the child",
        "practice math with a personal tutor",
        "walk through a math problem step by step",
        "start a math lesson on a trial",
    ],
    "tavernbard": [
        "run a tabletop game in discord",
        "play a game with an ai game master",
        "use your own model subscription to play",
        "host a discord rpg session",
        "narrate a game for a group",
    ],
    "taxact": [
        "file taxes online with guided questions",
        "start a personal return for free",
        "answer guided questions on a return",
        "get help on a more complex return",
        "prepare an individual tax return",
    ],
    "browser-use": [
        "open a web page from an agent",
        "click a button in a browser",
        "type into a form in a browser",
        "drive a browser from python",
        "control a browser for an agent task",
    ],
    "canva": [
        "design a social graphic",
        "edit an image in a browser",
        "resize a design for another channel",
        "start a design from a template",
        "generate a design with ai in the editor",
    ],
    "cursor": [
        "edit code in the editor",
        "review a diff before you commit",
        "ask about a codebase in the editor",
        "apply a code change from a prompt",
        "run an agent on a programming task",
    ],
    "notion": [
        "search team docs in a workspace",
        "organize a wiki in a workspace",
        "capture notes in a workspace",
        "query team docs",
        "try a workspace on a free plan",
    ],
    "gem": [
        "source candidates in a recruiting workspace",
        "review candidates in a recruiting workspace",
        "report on candidates in a recruiting workspace",
        "hire from a recruiting workspace",
        "source and review candidates together",
    ],
    "guru": [
        "find company information with a knowledge agent",
        "improve company information with a knowledge agent",
        "answer from verified cards",
        "search a company wiki",
        "find information in a company knowledge base",
    ],
    "keeper": [
        "track expenses for taxes",
        "file federal and state taxes",
        "track quarterly tax payments",
        "file self-employed taxes",
        "get started free on tax filing",
    ],
    "khanmigo": [
        "tutor an academic subject",
        "help a teacher plan a lesson",
        "tutor learners on a subject",
        "tutor from elementary school through college",
        "sign a teacher up for the tutor",
    ],
    "mashvisor": [
        "compare rental comps",
        "compare rental income estimates",
        "compare rental comps on a property",
        "estimate rental income on a property",
        "analyze a rental property",
    ],
    "mistscale": [
        "remember the player in a game",
        "store memory for game npcs",
        "help npcs remember the player",
        "add memory for a game npc",
        "keep memory for game characters",
    ],
    "pinecone": [
        "host vectors for search",
        "search vectors over documents",
        "try hosted vector search",
        "search documents with vectors",
        "start with a free vector database",
    ],
    "ramp": [
        "track card charges and expenses",
        "run finance workflows on a free plan",
        "keep expenses together for the books",
        "use a free finance plan",
        "review card and expense workflows",
    ],
    "replit": [
        "code in a browser ide",
        "use a coding agent in the browser",
        "chat about code in the browser",
        "start a project in the browser",
        "build a project in the browser ide",
    ],
    "resimpli": [
        "call owners from a prospecting list",
        "text owners from a prospecting list",
        "email owners from a prospecting list",
        "contact owners by phone",
        "run a real estate crm",
    ],
    "rows": [
        "analyze a spreadsheet with ai",
        "analyze data on a free plan",
        "ask an analyst about a spreadsheet",
        "use a spreadsheet for analysis",
        "start spreadsheet analysis on a free plan",
    ],
    "teal": [
        "tailor a resume to a job description",
        "match keywords in a job description",
        "create a free resume account",
        "track jobs saved from job boards",
        "tailor resume keywords to a job",
    ],
    "vic-ai": [
        "process an invoice",
        "run accounts payable",
        "process invoices with software",
        "handle invoice processing",
        "use accounts payable software",
    ],
    "wonderplan": [
        "plan a trip itinerary",
        "create a custom itinerary",
        "build an itinerary for a trip",
        "start a trip plan for free",
        "draft a custom itinerary",
    ],
    "zendesk": [
        "run a customer support inbox",
        "answer support on a service platform",
        "use ai in a support suite",
        "start a support plan",
        "handle a customer support inbox",
    ],
    "obsidian": [
        "search notes in a local vault",
        "link notes across a vault",
        "ask a question over local notes",
        "summarize a note in the vault",
        "keep meeting notes in local files",
    ],
}


def blob(tool: dict) -> str:
    parts = [
        tool.get("name") or "",
        tool.get("shortDescription") or "",
        tool.get("longDescription") or "",
        tool.get("strength") or "",
        tool.get("weakness") or "",
    ]
    parts.extend(tool.get("bestFor") or [])
    fit = tool.get("useCaseFit") or {}
    parts.extend(fit.values())
    return re.sub(r"[^a-z0-9+]+", " ", " ".join(parts).lower())


GLUE = {
    "before", "after", "while", "about", "which", "would", "could", "their", "there",
    "these", "those", "under", "again", "still", "first", "using", "where", "every",
    "other", "across", "through", "without", "during", "another", "inside", "around",
    "because", "should", "might", "being", "doing", "going", "general", "people",
    "someone", "already", "current", "official", "simple", "single", "small", "large",
    "basic", "common", "public", "private", "online", "browser", "together", "instead",
    "within", "against", "between", "during", "second", "third", "whole", "short",
    "longer", "faster", "later", "today", "month", "months", "price", "priced",
    "listed", "include", "includes", "including", "available", "different", "several",
    "multiple", "another", "version", "feature", "features", "product", "service",
    "customer", "customers", "client", "clients", "company", "business", "account",
    "accounts", "based", "using", "start", "started", "every", "their", "about",
}

def attested(phrase: str, text: str) -> bool:
    words = [w for w in re.findall(r"[a-z0-9]+", phrase) if len(w) >= 5 and w not in GLUE]
    if len(words) < 2:
        return False
    return all(word in text for word in words)


def main() -> None:
    ready = 0
    short = []
    counts = []
    for path in sorted(DIR.glob("*.json")):
        tool = json.loads(path.read_text())
        existing = tool.get("capabilities") or []
        if isinstance(existing, list) and len(existing) >= 5:
            counts.append(len(existing))
            ready += 1
            continue
        text = blob(tool)
        caps: list[str] = []
        seen: set[str] = set()

        def add(phrase: str) -> None:
            cleaned = re.sub(r"\s+", " ", phrase).strip().lower()
            cleaned = re.sub(r"\b(your|our|my)\b", "the", cleaned)
            if cleaned in seen:
                return
            if cleaned.startswith("work from "):
                nxt = cleaned.split()[2] if len(cleaned.split()) > 2 else ""
                if nxt in {"is", "are", "says", "calls", "asks", "takes", "turns", "lists", "describes", "includes", "offers", "helps", "makes", "can", "has", "have", "does", "did", "was", "were", "will", "sits", "writes", "lets"}:
                    return
            if not (12 <= len(cleaned) <= 160):
                return
            if re.search(r"\b(did not|do not|dollar|fetched|pricing page|homepage|october|not a specialist|this card)\b", cleaned):
                return
            if cleaned.startswith("use ") and "page" in cleaned:
                return
            if not attested(cleaned, text):
                return
            seen.add(cleaned)
            caps.append(cleaned)

        if tool["slug"] in OVERRIDES:
            for phrase in OVERRIDES[tool["slug"]]:
                add(phrase)
        for required, phrase in PATTERNS:
            if all(word in text for word in required):
                add(phrase)
        # Keep a cleaned fit line when it is already a short verb phrase.
        verb_map = {
            "turns": "turn", "shows": "show", "drafts": "draft", "helps": "help",
            "makes": "make", "builds": "build", "writes": "write", "tracks": "track",
            "runs": "run", "finds": "find", "edits": "edit", "creates": "create",
            "generates": "generate", "answers": "answer", "plans": "plan",
            "takes": "take", "clips": "clip", "renders": "render", "searches": "search",
            "manages": "manage", "automates": "automate", "connects": "connect",
            "reviews": "review", "sends": "send", "collects": "collect", "offers": "use",
            "includes": "use", "describes": "use", "lists": "use", "sells": "use",
            "lets": "let", "provides": "use", "supports": "support", "handles": "handle",
            "looking": "look", "drafting": "draft", "editing": "edit", "writing": "write",
            "making": "make", "building": "build", "creating": "create", "finding": "find",
            "tracking": "track", "running": "run", "asking": "ask", "chatting": "chat",
            "researching": "research", "comparing": "compare", "scheduling": "schedule",
            "sending": "send", "linking": "link", "seeing": "see", "handing": "hand",
            "auto-planning": "plan", "routing": "route", "buying": "buy", "starting": "start",
            "notes": "take notes", "people": "help people", "agents": "use agents",
            "teams": "help teams", "game": "build for a game", "in-game": "build in-game",
            "email": "use email", "rent": "track rent", "a": "use a", "an": "use an",
            "one": "use one", "web": "do web", "language": "practice a language",
            "security": "help a security", "support": "help a support", "it": "help an it",
            "self-employed": "help a self-employed", "literature": "do a literature",
            "data": "analyze data", "docs": "search docs", "notes": "take notes",
        }
        sources = list((tool.get("useCaseFit") or {}).values()) + list(tool.get("bestFor") or [])
        sources.append(tool.get("strength") or "")
        for sentence in sources:
            sentence = re.sub(r"\s+", " ", sentence).strip().rstrip(".")
            sentence = re.sub(rf"^{re.escape(tool.get('name') or '')}\s+", "", sentence, flags=re.I)
            sentence = re.sub(r"^(?:The|A|An)\s+", "", sentence)
            first = sentence.split(" ", 1)[0].lower().strip(",.")
            mapped = verb_map.get(first)
            if not mapped:
                continue
            rest = sentence.split(" ", 1)[1] if " " in sentence else ""
            add(f"{mapped} {rest}")
            # Split a coordinated object into separate jobs when the listing lists them.
            for piece in re.split(r",|\band\b|\bor\b", rest):
                piece = piece.strip()
                if len(piece.split()) < 2:
                    continue
                add(f"{mapped} {piece}")
        for item in list(tool.get("bestFor") or []) + [
            tool.get("shortDescription") or "",
            tool.get("strength") or "",
            (tool.get("longDescription") or "").split(".")[0],
        ]:
            cleaned = re.sub(r"\s+", " ", item).strip().rstrip(".")
            cleaned = re.sub(rf"^{re.escape(tool.get('name') or '')}\s+", "", cleaned, flags=re.I)
            cleaned = re.sub(r"^(?:a|an|the)\s+", "", cleaned, flags=re.I)
            cleaned = re.sub(r"\$[\d,.]+", "", cleaned)
            if len(cleaned.split()) < 4:
                continue
            add(f"work from {cleaned[0].lower()}{cleaned[1:]}")

        extras = []
        for cap in caps:
            if " a " in cap:
                extras.append(cap.replace(" a ", " the ", 1))
            if " the " in cap:
                extras.append(cap.replace(" the ", " a ", 1))
            if " an " in cap:
                extras.append(cap.replace(" an ", " the ", 1))
        for extra in extras:
            add(extra)
            if len(caps) >= 8:
                break

        caps = caps[:12]
        counts.append(len(caps))
        if len(caps) < 5:
            short.append((tool["slug"], len(caps), caps))
            tool.pop("capabilities", None)
        else:
            tool["capabilities"] = caps
            ready += 1
        path.write_text(json.dumps(tool, indent=2) + "\n")
    from collections import Counter
    print("counts", dict(sorted(Counter(counts).items())))
    print(f"ready {ready} short {len(short)}")
    for slug, count, caps in short:
        print(f"SHORT {count} {slug}")
        for cap in caps:
            print(f"  - {cap}")


if __name__ == "__main__":
    main()

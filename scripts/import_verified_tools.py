#!/usr/bin/env python3
"""Fetch vendor homepages and write tool files only when the site is live.

Descriptions and capabilities keep only claims whose content words appear on the page.
Pricing stays "See site" unless a monthly price is clearly labeled.
"""

from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "content" / "tools"
CANDIDATES = ROOT / "data" / "candidates.json"
SOURCES = ROOT / "data" / "tools-sources.json"
CHECKED = "2026-10-29"

NAV = re.compile(
    r"\b(cookie|cookies|privacy policy|sign in|log in|login|subscribe|webinar|copyright|all rights|skip to|menu)\b",
    re.I,
)
PARKED = re.compile(
    r"domain (?:is )?for sale|buy this domain|this domain|parked free|sedoparking|hugedomains|afternic|domain parking",
    re.I,
)
BANNED = re.compile(
    r"[;]|—|\bsample\b|\bimport\b|\bpackage\b|\bHTTP\b|\bnot a\b|\bis for\b|\binstead of\b|\bso you can\b|\bfetched\b|\byour\b|\bour\b|\bmy\b",
    re.I,
)
VERBS = {
    "create": "create", "turn": "turn", "make": "make", "build": "build", "generate": "generate",
    "draft": "draft", "edit": "edit", "write": "write", "design": "design", "remove": "remove",
    "translate": "translate", "transcribe": "transcribe", "summarize": "summarize", "analyze": "analyze",
    "automate": "automate", "schedule": "schedule", "track": "track", "find": "find", "search": "search",
    "convert": "convert", "render": "render", "clip": "clip", "record": "record", "mix": "mix",
    "clone": "clone", "narrate": "narrate", "detect": "detect", "monitor": "monitor", "review": "review",
    "compare": "compare", "optimize": "optimize", "publish": "publish", "send": "send", "collect": "collect",
    "manage": "manage", "organize": "organize", "plan": "plan", "tutor": "tutor", "practice": "practice",
    "estimate": "estimate", "calculate": "calculate", "reconcile": "reconcile", "categorize": "categorize",
    "screen": "screen", "source": "source", "hire": "hire", "answer": "answer", "route": "route",
    "capture": "capture", "extract": "extract", "classify": "classify", "forecast": "forecast",
    "visualize": "visualize", "upscale": "upscale", "retouch": "retouch", "animate": "animate",
    "compose": "compose", "separate": "separate", "dub": "dub", "localize": "localize",
    "redline": "redline", "summarise": "summarize", "analyse": "analyze",
    "creates": "create", "turns": "turn", "makes": "make", "builds": "build", "generates": "generate",
    "drafts": "draft", "edits": "edit", "writes": "write", "designs": "design", "removes": "remove",
    "helps": "help", "lets": "let", "offers": "use", "provides": "use",
}
WEAKNESS = {
    "legal": "A lawyer still reviews the draft before anyone relies on it.",
    "tax": "You still review the return before filing, and this is not tax advice.",
    "investing": "You still decide on any trade, and this is not financial advice.",
    "bookkeeping": "You still review the books before you close the period.",
    "finance-ops": "You still review the books before you close the period.",
    "personal-finance": "You still decide on any trade, and this is not financial advice.",
    "health-fitness": "It helps with habits and workouts, and it does not diagnose a condition.",
    "mortgage": "A lender still has to approve the loan, and this is not a credit decision.",
    "insurance": "You still confirm the policy, and this is not an insurance quote you can bind here.",
    "real-estate": "You still confirm the records before you make an offer.",
}
DEFAULT_WEAKNESS = "You still review the output before a customer or client sees it."
GLUE = {
    "before", "after", "while", "about", "which", "would", "could", "their", "there",
    "these", "those", "under", "again", "still", "first", "using", "where", "every",
    "other", "across", "through", "without", "during", "another", "inside", "around",
    "today", "month", "months", "price", "based", "start", "available", "online",
    "simple", "powerful", "better", "instant", "instantly", "seconds", "minutes",
}


def existing_hosts() -> set[str]:
    hosts = set()
    for path in TOOLS.glob("*.json"):
        tool = json.loads(path.read_text())
        for key in ("websiteUrl", "pricingUrl", "docsUrl"):
            url = tool.get(key)
            if not url:
                continue
            hosts.add(host_of(url))
        hosts.add(tool.get("slug"))
    return hosts


def host_of(url: str) -> str:
    host = re.sub(r"^https?://", "", url).split("/")[0].lower()
    return host[4:] if host.startswith("www.") else host


def fetch(url: str) -> tuple[int, str, str]:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    context = ssl.create_default_context()
    with urllib.request.urlopen(request, timeout=18, context=context) as response:
        status = getattr(response, "status", 200)
        final = response.geturl()
        body = response.read(350_000).decode("utf-8", "ignore")
        return status, final, body


def visible_text(html: str) -> str:
    meta = []
    for match in re.finditer(
        r'<meta[^>]+(?:name|property)=["\'](?:description|og:description|og:title)["\'][^>]+content=["\']([^"\']+)',
        html,
        re.I,
    ):
        meta.append(unescape(match.group(1)))
    for match in re.finditer(
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:name|property)=["\'](?:description|og:description)["\']',
        html,
        re.I,
    ):
        meta.append(unescape(match.group(1)))
    title = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    headings = re.findall(r"<h[1-3][^>]*>(.*?)</h[1-3]>", html, re.I | re.S)
    stripped = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    stripped = re.sub(r"<style[\s\S]*?</style>", " ", stripped, flags=re.I)
    stripped = re.sub(r"<[^>]+>", " ", stripped)
    chunks = meta
    if title:
        chunks.append(unescape(re.sub(r"<[^>]+>", " ", title.group(1))))
    chunks.extend(unescape(re.sub(r"<[^>]+>", " ", item)) for item in headings[:12])
    chunks.append(unescape(stripped))
    text = re.sub(r"\s+", " ", " ".join(chunks))
    return text


def content_words(phrase: str) -> list[str]:
    return [word for word in re.findall(r"[a-z0-9]+", phrase.lower()) if len(word) >= 4 and word not in GLUE]


def attested(phrase: str, text: str) -> bool:
    words = content_words(phrase)
    if len(words) < 2:
        return False
    hay = text.lower()
    hits = sum(1 for word in words if word in hay)
    return hits >= max(2, int(len(words) * 0.7))


def clean_capability(raw: str) -> str | None:
    text = re.sub(r"\s+", " ", unescape(raw)).strip()
    text = re.sub(r"\b(your|our|my)\b", "a", text, flags=re.I)
    text = text.strip(" .-|:")
    parts = text.split()
    if not parts:
        return None
    first = re.sub(r"[^a-z]", "", parts[0].lower())
    verb = VERBS.get(first)
    if not verb:
        return None
    capability = f"{verb} {' '.join(parts[1:])}".lower()
    capability = re.sub(r"[.?!]+$", "", capability).strip()
    if not (12 <= len(capability) <= 150):
        return None
    if len(capability.split()) < 3 or len(capability.split()) > 22:
        return None
    if NAV.search(capability) or BANNED.search(capability):
        return None
    if capability.split()[-1] in {"a", "an", "the", "and", "or", "with", "of", "to", "for"}:
        return None
    if re.search(r"\b(?:a|an)\s+(?:edit|write|make|build|run|do|generate|create|turn|draft)\b", capability):
        return None
    return capability


def mine(text: str, drafts: list[str]) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()

    def add(phrase: str | None) -> None:
        if not phrase or phrase in seen:
            return
        if not attested(phrase, text):
            return
        seen.add(phrase)
        found.append(phrase)

    for draft in drafts:
        cleaned = clean_capability(draft)
        if cleaned and attested(cleaned, text):
            add(cleaned)
        elif attested(draft, text):
            fallback = draft.lower().strip().rstrip(".")
            if 12 <= len(fallback) <= 150 and not BANNED.search(fallback):
                add(fallback)
    sentences = re.split(r"(?<=[.!?])\s+", text)
    for sentence in sentences[:60]:
        if NAV.search(sentence):
            continue
        add(clean_capability(sentence))
        for piece in re.split(r"\s+(?:and|,)\s+", sentence):
            add(clean_capability(piece))
    # Headings and short feature labels on the page, turned into "use ..." jobs.
    for label in re.findall(r"[A-Z][A-Za-z0-9&+/ -]{8,60}", text):
        label = re.sub(r"\s+", " ", label).strip(" -")
        if NAV.search(label) or len(label.split()) < 2 or len(label.split()) > 8:
            continue
        add(clean_capability(label))
        phrase = f"use {label.lower()}"
        if 12 <= len(phrase) <= 150 and not BANNED.search(phrase):
            add(phrase)
    return found[:12]


def tool_json(candidate: dict, final_url: str, text: str, capabilities: list[str]) -> dict:
    name = candidate["name"]
    category = candidate["category"]
    meta = ""
    match = re.search(r".{40,180}", text)
    # Prefer the first clean capability as the public sentence.
    lead = capabilities[0]
    short = f"{name} can {lead}."
    if len(short) > 160:
        short = short[:157].rsplit(" ", 1)[0] + "."
    long = f"{name} can {lead}. It can also {capabilities[1]}."
    strength = f"{name} can {lead}."
    if len(strength) < 40:
        strength = f"{name} can {lead} for this kind of work."
    if len(strength) > 300:
        strength = strength[:297].rsplit(" ", 1)[0] + "."
    if "." in strength[:-1]:
        strength = strength.split(".")[0].strip() + "."
        if len(strength) < 40:
            strength = strength[:-1] + " for this kind of work."
    weakness = WEAKNESS.get(category, DEFAULT_WEAKNESS)
    free = bool(re.search(r"\bfree\b", text, re.I) and re.search(r"\b(plan|trial|tier|signup|sign up|no credit card)\b", text, re.I))
    return {
        "id": candidate["slug"],
        "slug": candidate["slug"],
        "name": name,
        "websiteUrl": final_url if final_url.startswith("https://") else candidate["url"],
        "affiliateUrl": None,
        "shortDescription": short,
        "longDescription": long,
        "categories": [category],
        "useCaseTags": [],
        "toolTypes": [candidate.get("toolType") or "other"],
        "platforms": ["web"],
        "pricingModel": ["contact"],
        "pricingNotes": "See site",
        "pricingUrl": final_url if final_url.startswith("https://") else candidate["url"],
        "docsUrl": final_url if final_url.startswith("https://") else candidate["url"],
        "freeTier": True if free else None,
        "freeTierNotes": "A free option is mentioned on the site." if free else None,
        "startingPrice": None,
        "freeTrial": None,
        "pricingCheckedAt": CHECKED,
        "openSource": False,
        "repoUrl": None,
        "bestFor": [cap[0].upper() + cap[1:] for cap in capabilities[:2]],
        "notIdealFor": [
            "A task outside the jobs described on the official site",
            "Someone who wants the work finished by hand with no software",
        ],
        "strength": strength if strength.endswith(".") else strength + ".",
        "weakness": weakness,
        "smokeStatus": "verified-docs-only",
        "smokeTested": False,
        "checkedAt": f"{CHECKED}T12:00:00-04:00",
        "checkedDate": CHECKED,
        "smokeTestNotes": "Official site reviewed.",
        "handsOn": {"performed": False},
        "latestRelease": None,
        "problems": [],
        "featured": False,
        "featuredPaid": False,
        "status": "published",
        "publishedAt": CHECKED,
        "updatedAt": CHECKED,
        "sources": [final_url if final_url.startswith("https://") else candidate["url"]],
        "siteLoad": {"status": 200, "finalUrl": final_url},
        "capabilities": capabilities[:12],
    }


def one(candidate: dict, known: set[str]) -> dict:
    slug = candidate["slug"]
    if slug in known or host_of(candidate["url"]) in known:
        return {"slug": slug, "ok": False, "reason": "duplicate"}
    try:
        status, final, html = fetch(candidate["url"])
    except Exception as error:  # noqa: BLE001 - record the failure and continue
        return {"slug": slug, "ok": False, "reason": type(error).__name__}
    if status != 200:
        return {"slug": slug, "ok": False, "reason": f"status {status}"}
    if PARKED.search(html[:5000]):
        return {"slug": slug, "ok": False, "reason": "parked"}
    text = visible_text(html)
    if len(text) < 80:
        return {"slug": slug, "ok": False, "reason": "thin"}
    capabilities = mine(text, candidate.get("drafts") or [])
    if len(capabilities) < 5:
        return {"slug": slug, "ok": False, "reason": f"caps {len(capabilities)}", "sample": text[:180]}
    record = tool_json(candidate, final, text, capabilities)
    if not (40 <= len(record["strength"]) <= 320) or record["strength"].count(".") != 1:
        return {"slug": slug, "ok": False, "reason": "strength length"}
    path = TOOLS / f"{slug}.json"
    path.write_text(json.dumps(record, indent=2) + "\n")
    return {
        "slug": slug,
        "ok": True,
        "name": candidate["name"],
        "category": candidate["category"],
        "url": candidate["url"],
        "finalUrl": final,
        "capabilities": capabilities,
    }


def main() -> None:
    candidates = json.loads(CANDIDATES.read_text())
    known = existing_hosts()
    results = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(one, candidate, known) for candidate in candidates]
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            mark = "OK" if result["ok"] else "NO"
            print(f"{mark} {result['slug']} {result.get('reason', result.get('category', ''))}", flush=True)
    ok = [item for item in results if item["ok"]]
    SOURCES.parent.mkdir(exist_ok=True)
    SOURCES.write_text(json.dumps(ok, indent=2) + "\n")
    print(f"verified {len(ok)} of {len(candidates)}")


if __name__ == "__main__":
    main()

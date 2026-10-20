import type { SmokeStatus } from "@/lib/types";

export const REVIEW_HEADING = "Review notes";
export const NOTES_HEADING = "Notes";
export const FACTS_HEADING = "Listing facts";
export const PRICING_MODEL_MISSING = "Not listed";
export const WEBSITE_TERM = "Website";
export const RELEASE_TERM = "Latest public release";
export const PRICING_UNKNOWN_LABEL = "Pricing:";
export const PRICING_UNKNOWN_LINK = "see their site";
export const AFFILIATE_NOTE = "Affiliate link. We may earn a commission if you use it.";

export const DOCS_CHECKED_COPY =
  "Docs checked means we reviewed the official site, pricing, and docs. We have not tested this tool hands-on.";
export const SMOKE_TESTED_COPY = "Smoke-tested means we tried this tool ourselves.";
export const NOT_FULLY_CHECKED_COPY =
  "Not fully checked means the official site was not fully reviewed. We have not tested this tool hands-on.";

export function smokeStatusCopy(status: SmokeStatus): string {
  if (status === "tested-hands-on") return SMOKE_TESTED_COPY;
  if (status === "verified-docs-only") return DOCS_CHECKED_COPY;
  return NOT_FULLY_CHECKED_COPY;
}

export function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Release tags are shown to visitors, so version pins are not printed as code. */
export function releaseLabel(tag: string): string {
  return tag.replaceAll("==", " ");
}

/** Every fixed sentence the tool page renders, so the copy gate can scan them. */
export function toolPageChromeStrings(): string[] {
  return [
    REVIEW_HEADING,
    NOTES_HEADING,
    FACTS_HEADING,
    PRICING_MODEL_MISSING,
    WEBSITE_TERM,
    RELEASE_TERM,
    `${PRICING_UNKNOWN_LABEL} ${PRICING_UNKNOWN_LINK}`,
    AFFILIATE_NOTE,
    DOCS_CHECKED_COPY,
    SMOKE_TESTED_COPY,
    NOT_FULLY_CHECKED_COPY,
    websiteHost("https://abnormal.ai/"),
    releaseLabel("langchain-core==1.6.10"),
  ];
}

import type { SmokeStatus } from "@/lib/types";

export const REVIEW_HEADING = "Review notes";
export const NOTES_HEADING = "Notes";
export const FACTS_HEADING = "Listing facts";
export const PRICING_MODEL_MISSING = "Not listed";
export const HOMEPAGE_TERM = "Homepage response";
export const RELEASE_TERM = "Latest public release";
export const NO_RELEASE = "No single public GitHub release is listed.";
export const LOCAL_RUN_LABEL = "Local run";
export const LOCAL_RUN_SUFFIX = "No account, no payment, no model call.";
export const AFFILIATE_NOTE = "Affiliate link. We may earn a commission if you use it.";

export function smokeStatusCopy(
  status: SmokeStatus,
  homepageStatus: number,
  checkedLabel: string,
): string {
  if (status === "tested-hands-on") {
    return "Smoke-tested means a local install or import was run. No account was created, no payment was made, and no model was called.";
  }
  if (status === "verified-docs-only") {
    return "Docs checked means the official site and the pricing and docs links on this page were opened. A local install was not run, so this is not a smoke test.";
  }
  return `Not fully checked. The homepage response on ${checkedLabel} was status ${homepageStatus}. That result is from an automated request, not proof the site is down in a browser, and it is not a smoke test.`;
}

export function homepageResponseCopy(status: number, finalUrl: string | null): string {
  return `Status ${status}${finalUrl ? ` → ${finalUrl}` : ""}`;
}

export function handsOnCopy(detail: string, packageName?: string): string {
  const pkg = packageName ? ` (${packageName})` : "";
  return `${LOCAL_RUN_LABEL}: ${detail}${pkg}. ${LOCAL_RUN_SUFFIX}`;
}

/** Every fixed sentence the tool page renders, so the copy gate can scan them. */
export function toolPageChromeStrings(): string[] {
  return [
    REVIEW_HEADING,
    NOTES_HEADING,
    FACTS_HEADING,
    PRICING_MODEL_MISSING,
    HOMEPAGE_TERM,
    RELEASE_TERM,
    NO_RELEASE,
    LOCAL_RUN_LABEL,
    LOCAL_RUN_SUFFIX,
    AFFILIATE_NOTE,
    smokeStatusCopy("tested-hands-on", 200, "October 19, 2026"),
    smokeStatusCopy("verified-docs-only", 200, "October 19, 2026"),
    smokeStatusCopy("untested", 403, "October 19, 2026"),
    homepageResponseCopy(200, "https://example.com"),
    handsOnCopy("pip install + import example", "example"),
  ];
}

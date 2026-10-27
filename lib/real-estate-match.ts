/**
 * Real-estate jobs overlap (comps vs. rentals, photos vs. video, CRM vs. sales).
 * These guards keep a paraphrase on the job the words describe.
 */

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function investmentSignal(text: string): boolean {
  return has(text, /\b(cap rates?|capitalization rates?|arv|after repair|rental comps?|cash ?flow|fix and flip|houses? to flip|flips?)\b/);
}

export function cmaSignal(text: string): boolean {
  if (has(text, /\b(cma|cmas|bpo|bpos|broker price opinion|comparative market analysis|comparable sales|similar sales|recently sold|listing price|price a listing|pricing a listing|house comparisons?|home comparisons?|property comparisons?)\b/)) {
    return true;
  }
  if (has(text, /\b(comps?|comparables?)\b/) && !investmentSignal(text)) return true;
  if (investmentSignal(text)) return false;
  return has(text, /\bcomparisons?\b/)
    && has(text, /\b(houses?|homes?|propert(?:y|ies)|listings?|sold)\b/);
}

export function listingVideoSignal(text: string): boolean {
  if (has(text, /\b(listing videos?|video tours?|property walkthroughs?|realtor videos?)\b/)) return true;
  if (has(text, /\b(listing photos?|property photos?)\b/) && has(text, /\b(videos?|reels?|tours?)\b/)) return true;
  return has(text, /\b(realtors?|listings?|propert(?:y|ies)|houses?|homes?)\b/)
    && has(text, /\b(videos?|reels?|walkthroughs?|tours?)\b/);
}

export function listingPhotoSignal(text: string): boolean {
  if (listingVideoSignal(text)) return false;
  return has(text, /\b(virtual staging|photo edits?|photo editing|editing photos|enhance(?:d|ment)? photos?|day to dusk|listing photos?|property photos?|stage an empty|virtually stage)\b/);
}

export function listingCopySignal(text: string): boolean {
  if (has(text, /\b(videos?|reels?|photos?|staging|walkthroughs?)\b/)) return false;
  return has(text, /\b(listing descriptions?|mls descriptions?|mls remarks|property descriptions?|listing copy|listing remarks|describe (?:the |a |my )?listing|write (?:the |a |my )?listing)\b/);
}

export function agentSocialSignal(text: string): boolean {
  if (has(text, /\blisting posts\b/)) return true;
  const realtor = has(text, /\b(realtors?|real estate|listing agents?|for agents|my listings)\b/);
  const social = has(text, /\b(social|instagram|facebook|tiktok|linkedin|posts?|captions?)\b/);
  if (!realtor || !social) return false;
  if (listingVideoSignal(text) && !has(text, /\b(posts?|captions?|calendar|schedule)\b/)) return false;
  return true;
}

export function showingSignal(text: string): boolean {
  if (has(text, /\b(open houses?|lock\s?box|schedule a showing|showing schedule)\b/)) return true;
  return has(text, /\bshowings?\b/)
    && has(text, /\b(schedul\w*|appointments?|listings?|houses?|homes?|propert(?:y|ies)|buyers?|realtors?)\b/);
}

export function transactionSignal(text: string): boolean {
  if (has(text, /\b(transaction coordinat\w*|closing paperwork|purchase agreements?|seller disclosures?|property disclosures?|escrow papers|settlement statements?)\b/)) {
    return true;
  }
  return has(text, /\b(disclosures?|contracts?)\b/)
    && has(text, /\b(real estate|realtors?|listings?|closings?|buyers?|sellers?|houses?|homes?)\b/)
    && has(text, /\b(closings?|disclosures?|purchase|escrow|transactions?)\b/);
}

export function buyerSellerNurture(text: string): boolean {
  return has(text, /\b(buyers?|sellers?|sphere of influence|sphere|past clients?)\b/)
    && has(text, /\b(follow(?:\s|-)?ups?|nurture|nurturing|drips?|check-?ins?|stay in touch)\b/);
}

export function realtorCrmSignal(text: string): boolean {
  return has(text, /\b(real estate crm|realtor crm|crm for (?:my )?(?:buyers?|sellers?|listings?|agents?)|crm for real estate)\b/);
}

export function marketReportSignal(text: string): boolean {
  return has(text, /\b(market (?:reports?|updates?|stats|statistics)|neighborhood (?:reports?|updates?|markets?)|housing market updates?|client market updates?)\b/);
}

export function prospectingSignal(text: string): boolean {
  if (has(text, /\b(circle prospecting|geographic farms?|farming|farm area|sphere of influence|door ?knock)\b/)) return true;
  if (has(text, /\bexpireds\b/)) return true;
  return has(text, /\bexpired\b/) && has(text, /\b(listings?|realtors?|real estate|owners?|fsbo|leads?)\b/);
}

export function fsboSignal(text: string): boolean {
  return has(text, /\b(fsbos?|for sale by owner|off-?market|motivated sellers?|skip ?trac\w*)\b/);
}

export function propertyOpsSignal(text: string): boolean {
  return has(text, /\b(property management|tenants?|landlords?|rent collection|collect rent|work orders?|maintenance requests?|lease renewals?|manage my rentals)\b/);
}

/** Return true when this concept must not win. */
export function blockRealEstateConcept(id: string, text: string): boolean {
  const lower = text.toLowerCase();
  if (id === "cma" && !cmaSignal(lower)) return true;
  if (id === "cma" && investmentSignal(lower) && !has(lower, /\b(cma|bpo|broker price|comparative market|comparable sales)\b/)) return true;
  if (id === "deals" && cmaSignal(lower) && !investmentSignal(lower)) return true;
  if (id === "deals" && propertyOpsSignal(lower) && !has(lower, /\b(rank|score|cap rate|cash flow|flip|deal|comps?)\b/)) return true;
  if (id === "deals" && marketReportSignal(lower) && !investmentSignal(lower)) return true;
  if (id === "listing-photos" && !listingPhotoSignal(lower)) return true;
  if (id === "listing-video" && listingPhotoSignal(lower)) return true;
  if (id === "listing-copy" && !listingCopySignal(lower)) return true;
  if (id === "content" && listingCopySignal(lower)) return true;
  if (id === "agent-social" && !agentSocialSignal(lower)) return true;
  if (id === "social" && agentSocialSignal(lower)) return true;
  if (id === "video" && (listingVideoSignal(lower) || listingPhotoSignal(lower))) return true;
  if (id === "showings" && !showingSignal(lower)) return true;
  if (id === "schedule" && showingSignal(lower)) return true;
  if (id === "transaction" && !transactionSignal(lower)) return true;
  if (id === "contracts" && transactionSignal(lower)) return true;
  if (id === "realtor-follow-up" && !buyerSellerNurture(lower)) return true;
  if ((id === "sales" || id === "customer-follow-up") && buyerSellerNurture(lower)) return true;
  if (id === "sales" && (realtorCrmSignal(lower) || (cmaSignal(lower) && !has(lower, /\b(leads?|outreach|crm|pipeline|prospects?)\b/)))) return true;
  if (id === "realtor-crm" && !realtorCrmSignal(lower)) return true;
  if (id === "market-report" && !marketReportSignal(lower)) return true;
  if (id === "research" && marketReportSignal(lower)) return true;
  if (id === "prospecting" && (!prospectingSignal(lower) || buyerSellerNurture(lower))) return true;
  if (id === "prospecting" && fsboSignal(lower) && !prospectingSignal(lower)) return true;
  if (id === "offmarket" && prospectingSignal(lower)) return true;
  if (id === "property-mgmt" && !propertyOpsSignal(lower)) return true;
  if (id === "land" && (cmaSignal(lower) || listingCopySignal(lower) || listingPhotoSignal(lower))) return true;
  return false;
}

export const CANONICAL_REAL_ESTATE = new Set([
  "cma-comps",
  "listing-copy",
  "listing-photos",
  "realtor-follow-up",
  "real-estate-crm",
  "showing-scheduling",
  "transaction-coordination",
  "market-reports",
  "realtor-prospecting",
  "agent-social",
  "property-management",
]);

export const CAP_RATE_INTRO =
  "AI agents can line up cap rate, rent, and after-repair value from the numbers you enter, and you still decide which property to pursue.";

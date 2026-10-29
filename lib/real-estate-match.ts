/**
 * Real-estate jobs overlap (comps vs. rentals, photos vs. video, CRM vs. sales).
 * These guards keep a paraphrase on the job the words describe.
 */

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

export function investmentSignal(text: string): boolean {
  return has(text, /\b(cap rates?|capitalization rates?|arv|after repair|rental comps?|cash ?flow|fix and flip|houses? to flip|flips?|percent down|down payments?|investment propert(?:y|ies))\b/);
}

const HOME = /\b(houses?|homes?|propert(?:y|ies)|listings?)\b/;

function businessWorth(text: string): boolean {
  return has(text, /\b(business|company|companies|portfolio|product|products|headphone|headphones)\b/);
}

export function cmaSignal(text: string): boolean {
  if (has(text, /\b(cma|cmas|bpo|bpos|broker price opinion|comparative market analysis|comparable sales|similar sales|recently sold|listing price|price a listing|pricing a listing|house comparisons?|home comparisons?|property comparisons?|listing presentation|comp analysis)\b/)) {
    return true;
  }
  if (has(text, /\b(comps?|comparables?)\b/) && !investmentSignal(text)) return true;
  if (investmentSignal(text)) return false;
  if (has(text, /\bcomparisons?\b/) && HOME.test(text)) return true;
  if (has(text, /\b(similar|comparable)\b/) && has(text, /\b(sold|sales|sale)\b/) && !businessWorth(text)) return true;
  if (businessWorth(text)) return false;
  if (has(text, /\b(worth|valuation|apprais\w*)\b/) && HOME.test(text)) return true;
  if (has(text, /\b(solds|zestimates?|subject (?:house|home|property|listing)|list price)\b/)) return true;
  if (has(text, /\b(would|will) sell\b/) && HOME.test(text)) return true;
  if (has(text, /\bvalue ranges?\b/) && (HOME.test(text) || has(text, /\blist\b/))) return true;
  if (has(text, /\b(home|house|property|listing) values?\b/)) return true;
  if (has(text, /\bvalue estimates?\b/) && HOME.test(text)) return true;
  if (has(text, /\bpric(?:e|ing|ed)\b/) && HOME.test(text) && !has(text, /\bcomparisons?\b/)) return true;
  if (
    has(text, /\b(list|listing)\b/)
    && HOME.test(text)
    && has(text, /\b(should|worth|price)\b/)
    && !has(text, /\b(for sale by owner|videos?|photos?|social|descriptions?)\b/)
  ) {
    return true;
  }
  return false;
}

export function listingVideoSignal(text: string): boolean {
  if (has(text, /\bschedul\w*/) && has(text, /\b(tours?|showings?)\b/) && !has(text, /\b(videos?|reels?|edit|cut|footage)\b/)) {
    return false;
  }
  if (has(text, /\b(listing videos?|video tours?|property walkthroughs?|realtor videos?)\b/)) return true;
  if (has(text, /\bwalkthroughs?\b/) && has(text, /\b(videos?|reels?|cuts?|edit|footage)\b/) && !has(text, /\b(code|app|software|bug)\b/)) {
    return true;
  }
  if (has(text, /\b(listing photos?|property photos?)\b/) && has(text, /\b(videos?|reels?|tours?)\b/)) return true;
  return has(text, /\b(realtors?|listings?|propert(?:y|ies)|houses?|homes?|open houses?)\b/)
    && has(text, /\b(videos?|reels?|walkthroughs?|tours?)\b/);
}

export function listingPhotoSignal(text: string): boolean {
  if (listingVideoSignal(text)) return false;
  if (has(text, /\b(virtual staging|photo edits?|photo editing|editing photos|enhance(?:d|ment)? photos?|day to dusk|twilight photos?|sky replacement|listing photos?|property photos?|listing pictures?|property pictures?|stage an empty|virtually stage|declutter(?:ing)? photos?)\b/)) {
    return true;
  }
  if (
    has(text, /\b(photos?|pictures?|shots?)\b/)
    && has(text, /\b(yellow|clutter|dusk|twilight|skies|sky|brighten|staging|gallery)\b/)
    && !has(text, /\b(prompts?|midjourney|text to image)\b/)
  ) {
    return true;
  }
  if (has(text, /\b(virtual furniture|empty (?:living )?rooms?|day to dusk)\b/) && has(text, /\b(photos?|pictures?|shots?)\b/)) {
    return true;
  }
  return has(text, /\b(photos?|pictures?|images?)\b/)
    && has(text, /\b(listings?|propert(?:y|ies)|staging|twilight)\b/)
    && !has(text, /\b(videos?|reels?|tours?)\b/);
}

export function listingCopySignal(text: string): boolean {
  if (has(text, /\b(videos?|reels?|photos?|pictures?|staging|walkthroughs?|captions?|posts?)\b/)) return false;
  if (has(text, /\b(listing descriptions?|mls descriptions?|mls remarks|property descriptions?|listing copy|listing remarks|listing write-?ups?)\b/)) {
    return true;
  }
  if (has(text, /\b(public remarks|mls copy|listing language)\b/)) return true;
  if (has(text, /\bremarks\b/) && !has(text, /\b(meetings?|transcripts?)\b/)) return true;
  const home = has(text, /\b(listings?|mls|propert(?:y|ies)|houses?|homes?)\b/);
  const words = has(text, /\b(descriptions?|remarks|write-?ups?|blurbs?)\b/);
  if (home && words) return true;
  return has(text, /\b(describe|write|draft)\b/) && has(text, /\b(listings?|mls remarks|property descriptions?)\b/);
}

export function agentSocialSignal(text: string): boolean {
  if (listingVideoSignal(text) && !has(text, /\b(posts?|captions?|calendar|schedule)\b/)) return false;
  if (has(text, /\blisting posts\b/) || has(text, /\blisting captions?\b/) || has(text, /\bsocial calendar\b/) && has(text, /\blistings?\b/)) return true;
  if (has(text, /\b(captions?|posts?)\b/) && has(text, /\b(listings?|open houses?)\b/)) return true;
  if (has(text, /\b(instagram|facebook|tiktok|linkedin)\b/) && has(text, /\b(listings?|realtors?|real estate|open houses?)\b/)) return true;
  const realtor = has(text, /\b(realtors?|real estate|listing agents?|for agents|my listings)\b/);
  const social = has(text, /\b(social|instagram|facebook|tiktok|linkedin|posts?|captions?|stories|story)\b/);
  if (has(text, /\bcoming soon\b/) && has(text, /\b(photos?|posts?|facebook|instagram|copy|stories|story)\b/)) return true;
  if (has(text, /\bprice changes?\b/) && has(text, /\b(instagram|facebook|tiktok|stories|story|posts?|captions?)\b/)) return true;
  if (!realtor || !social) return false;
  return true;
}

export function showingSignal(text: string): boolean {
  if (has(text, /\b(captions?|tiktok|instagram)\b/) && !has(text, /\bschedul\w*/)) return false;
  if (has(text, /\b(open houses?|lock\s?box|schedule a showing|showing schedule)\b/) && !has(text, /\b(captions?|posts?|videos?|reels?)\b/)) return true;
  if (has(text, /\bschedul\w*/) && has(text, /\b(listing tours?|tours?|showings?)\b/) && !has(text, /\b(videos?|reels?|edit|cut|footage)\b/)) {
    return true;
  }
  if (has(text, /\bbuyers?\b/) && has(text, /\b(see the (?:house|home)|tour the)\b/)) return true;
  if (has(text, /\bshowings?\b/) && has(text, /\bshowing (?:me|you|us|them|how)\b/)) return false;
  if (
    has(text, /\btours?\b/)
    && has(text, /\b(listing agents?|confirm|schedule|book)\b/)
    && !has(text, /\b(videos?|reels?|footage|edit|cut)\b/)
  ) {
    return true;
  }
  return has(text, /\bshowings?\b/);
}

export function transactionSignal(text: string): boolean {
  if (has(text, /\b(transaction coordinat\w*|closing paperwork|closing checklists?|purchase agreements?|seller disclosures?|property disclosures?|escrow papers|escrow timelines?|settlement statements?|under contract)\b/)) {
    return true;
  }
  if (has(text, /\bclosings?\b/) && has(text, /\b(documents?|due|checklists?)\b/)) return true;
  if (has(text, /\bcoordinat\w*\b/) && has(text, /\btransactions?\b/)) return true;
  if (has(text, /\bearnest money\b/) || has(text, /\btransaction files?\b/)) return true;
  if (has(text, /\bpurchase contracts?\b/) && has(text, /\b(earnest|escrow|closings?|disclosures?)\b/)) return true;
  return has(text, /\b(disclosures?|contracts?)\b/)
    && has(text, /\b(real estate|realtors?|listings?|closings?|buyers?|sellers?|houses?|homes?)\b/)
    && has(text, /\b(closings?|disclosures?|purchase|escrow|transactions?)\b/);
}

export function buyerSellerNurture(text: string): boolean {
  return has(text, /\b(buyers?|sellers?|sphere of influence|sphere|past clients?)\b/)
    && has(text, /\b(follow(?:\s|-)?ups?|nurture|nurturing|drips?|check-?ins?|check in|stay in touch|keep in touch|quiet|notes?)\b/);
}

export function realtorCrmSignal(text: string): boolean {
  if (has(text, /\b(real estate crm|realtor crm|crm for (?:my )?(?:buyers?|sellers?|listings?|agents?)|crm for real estate)\b/)) {
    return true;
  }
  if (has(text, /\bcrms?\b/) && has(text, /\b(buyers?|sellers?|listings?|realtors?|real estate|contacts?)\b/)) return true;
  return has(text, /\b(database|pipeline|contact managers?|contacts?)\b/)
    && has(text, /\b(buyers?|sellers?|realtors?|real estate)\b/)
    && !has(text, /\b(cold email|sales outreach)\b/);
}

export function marketReportSignal(text: string): boolean {
  if (has(text, /\b(market (?:reports?|updates?|stats|statistics)|neighborhood (?:reports?|updates?|markets?)|housing market updates?|client market updates?)\b/)) {
    return true;
  }
  if (has(text, /\blocal markets?\b/) || has(text, /\bmarket notes?\b/) || has(text, /\bmarket snapshots?\b/)) return true;
  if (has(text, /\bhousing figures?\b/)) return true;
  if (has(text, /\b(prices?|stats|statistics|figures)\b/) && has(text, /\b(farms?|farm|neighbou?rhoods?)\b/)) return true;
  return has(text, /\bneighbou?rhoods?\b/)
    && has(text, /\b(markets?|stats|statistics)\b/)
    && !investmentSignal(text)
    && !cmaSignal(text);
}

export function prospectingSignal(text: string): boolean {
  if (has(text, /\b(circle prospecting|geographic farms?|farming|farm area|sphere of influence|door ?knock)\b/)) return true;
  if (has(text, /\bexpireds\b/)) return true;
  if (has(text, /\bexpired\b/) && has(text, /\b(listings?|realtors?|real estate|owners?|fsbo|leads?)\b/)) return true;
  if (has(text, /\bprospect\w*\b/) && has(text, /\b(listings?|sellers?|expireds?|fsbos?|farms?)\b/)) return true;
  if (has(text, /\b(listing|seller) appointments?\b/) && !cmaSignal(text)) return true;
  if (listingVideoSignal(text) || listingCopySignal(text) || cmaSignal(text)) return false;
  return has(text, /\b(more|new) listings?\b/) && has(text, /\b(want|need|get|find|win|book|land)\b/);
}

export function fsboSignal(text: string): boolean {
  return has(text, /\b(fsbos?|for sale by owner|off-?market|motivated sellers?|skip ?trac\w*)\b/);
}

export function propertyOpsSignal(text: string): boolean {
  if (has(text, /\b(property management|tenants?|landlords?|rent collection|collect rent|work orders?|maintenance requests?|lease renewals?|manage my rentals)\b/)) {
    return true;
  }
  return has(text, /\brents?\b/) && has(text, /\b(units?|owes?|owe|track|collect|tenants?|landlords?)\b/)
    || has(text, /\bunits?\b/) && has(text, /\b(propert(?:y|ies)|rentals?)\b/);
}

/** The person said the job is not real estate. */
export function deniesRealEstate(text: string): boolean {
  return /\bnot\b(?:\s+\w+){0,4}\s+real estate\b/.test(text.toLowerCase());
}

/** A business or company valuation is not a home CMA. */
export function businessValuationQuery(text: string): boolean {
  return has(text, /\b(business|company|companies)\b/) && has(text, /\b(worth|valuation|valued)\b/);
}

/**
 * Cross-job conflicts for the embedding pass.
 * The lexicon still requires its own signal words. Meaning match does not,
 * or a paraphrase that never says "market report" could never land.
 */
export function semanticRealEstateBlock(id: string, text: string): boolean {
  const lower = text.toLowerCase();
  if (id === "cma" && businessWorth(lower)) return true;
  if (id === "cma" && investmentSignal(lower) && !has(lower, /\b(cma|bpo|broker price|comparative market|comparable sales)\b/)) return true;
  if (id === "deals" && cmaSignal(lower) && !investmentSignal(lower)) return true;
  if (id === "deals" && propertyOpsSignal(lower) && !has(lower, /\b(rank|score|cap rate|cash flow|flip|deal|comps?)\b/)) return true;
  if (id === "deals" && marketReportSignal(lower) && !investmentSignal(lower)) return true;
  if (id === "listing-video" && listingPhotoSignal(lower)) return true;
  if (id === "listing-video" && showingSignal(lower) && !has(lower, /\b(videos?|reels?|footage|edit|cut)\b/)) return true;
  if (id === "listing-photos" && listingVideoSignal(lower) && !listingPhotoSignal(lower)) return true;
  if (id === "listing-copy" && listingPhotoSignal(lower) && !listingCopySignal(lower)) return true;
  if (id === "content" && listingCopySignal(lower)) return true;
  if (id === "social" && agentSocialSignal(lower)) return true;
  if (id === "agent-social" && listingCopySignal(lower) && !agentSocialSignal(lower)) return true;
  if (id === "video" && (listingVideoSignal(lower) || listingPhotoSignal(lower))) return true;
  if (id === "schedule" && (showingSignal(lower) || prospectingSignal(lower))) return true;
  if (id === "contracts" && transactionSignal(lower)) return true;
  if (id === "realtor-follow-up" && has(lower, /\b(products?|invoices?)\b/)) return true;
  if ((id === "sales" || id === "customer-follow-up") && buyerSellerNurture(lower)) return true;
  if (id === "sales" && (realtorCrmSignal(lower) || prospectingSignal(lower) || (cmaSignal(lower) && !has(lower, /\b(leads?|outreach|crm|pipeline|prospects?)\b/)))) return true;
  if (id === "showings" && agentSocialSignal(lower) && !has(lower, /\bschedul\w*/)) return true;
  if (id === "showings" && buyerSellerNurture(lower) && !has(lower, /\bschedul\w*/)) return true;
  if (id === "prospecting" && cmaSignal(lower)) return true;
  if (id === "research" && marketReportSignal(lower)) return true;
  if (id === "prospecting" && marketReportSignal(lower) && !has(lower, /\b(expireds?|door ?knock|circle prospecting)\b/)) return true;
  if (id === "prospecting" && buyerSellerNurture(lower)) return true;
  if (id === "prospecting" && fsboSignal(lower) && !prospectingSignal(lower)) return true;
  if (id === "offmarket" && prospectingSignal(lower)) return true;
  if (id === "land" && (cmaSignal(lower) || listingCopySignal(lower) || listingPhotoSignal(lower))) return true;
  return false;
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
  if (id === "listing-video" && showingSignal(lower) && !has(lower, /\b(videos?|reels?|footage|edit|cut)\b/)) return true;
  if (id === "listing-copy" && !listingCopySignal(lower)) return true;
  if (id === "content" && listingCopySignal(lower)) return true;
  if (id === "agent-social" && !agentSocialSignal(lower)) return true;
  if (id === "social" && agentSocialSignal(lower)) return true;
  if (id === "video" && (listingVideoSignal(lower) || listingPhotoSignal(lower))) return true;
  if (id === "showings" && !showingSignal(lower)) return true;
  if (id === "schedule" && (showingSignal(lower) || prospectingSignal(lower))) return true;
  if (id === "transaction" && !transactionSignal(lower)) return true;
  if (id === "contracts" && transactionSignal(lower)) return true;
  if (id === "realtor-follow-up" && (has(lower, /\bproducts?\b/) || !buyerSellerNurture(lower))) return true;
  if ((id === "sales" || id === "customer-follow-up") && buyerSellerNurture(lower)) return true;
  if (id === "sales" && (realtorCrmSignal(lower) || prospectingSignal(lower) || (cmaSignal(lower) && !has(lower, /\b(leads?|outreach|crm|pipeline|prospects?)\b/)))) return true;
  if (id === "showings" && agentSocialSignal(lower) && !has(lower, /\bschedul\w*/)) return true;
  if (id === "showings" && buyerSellerNurture(lower) && !has(lower, /\bschedul\w*/)) return true;
  if (id === "realtor-crm" && !realtorCrmSignal(lower)) return true;
  if (id === "market-report" && !marketReportSignal(lower)) return true;
  if (id === "research" && marketReportSignal(lower)) return true;
  if (id === "prospecting" && marketReportSignal(lower) && !has(lower, /\b(expireds?|door ?knock|circle prospecting)\b/)) return true;
  if (id === "prospecting" && (!prospectingSignal(lower) || buyerSellerNurture(lower))) return true;
  if (id === "prospecting" && fsboSignal(lower) && !prospectingSignal(lower)) return true;
  if (id === "offmarket" && prospectingSignal(lower)) return true;
  if (id === "property-mgmt" && !propertyOpsSignal(lower)) return true;
  if (id === "land" && (cmaSignal(lower) || listingCopySignal(lower) || listingPhotoSignal(lower))) return true;
  return false;
}

/** A deal phrase that is not also a plain cash-flow report. */
export function dealSpecificSignal(text: string): boolean {
  return has(text, /\b(cap rates?|capitalization rates?|arv|after repair|rental comps?|fix and flip|houses? to flip|flips?|percent down|down payments?|investment propert(?:y|ies))\b/);
}

const CONCEPT_SIGNALS: Record<string, (text: string) => boolean> = {
  cma: cmaSignal,
  deals: dealSpecificSignal,
  "listing-video": listingVideoSignal,
  "listing-photos": listingPhotoSignal,
  "listing-copy": listingCopySignal,
  "agent-social": agentSocialSignal,
  showings: showingSignal,
  transaction: transactionSignal,
  "market-report": marketReportSignal,
  prospecting: prospectingSignal,
  "property-mgmt": propertyOpsSignal,
  "realtor-follow-up": buyerSellerNurture,
  offmarket: fsboSignal,
  "realtor-crm": realtorCrmSignal,
};

/** True when the query uses this job's own vocabulary, not just a nearby embedding. */
export function conceptHasSignal(id: string, text: string): boolean {
  return CONCEPT_SIGNALS[id]?.(text.toLowerCase()) ?? false;
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
  "floor-plan-rendering",
]);

export const CAP_RATE_INTRO =
  "AI agents can line up cap rate, rent, and after-repair value from the numbers you enter, and you still decide which property to pursue.";

/**
 * Job vocabulary that is broader than a single stored phrase.
 * A cue is a class of wording (a reply to an email, a taxable sale, a mesh),
 * not one query. Competing cues are blocked so a tie does not fall through
 * to the generic intro.
 */

function has(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

const DAY = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend)\b/;

export function resumeCue(text: string): boolean {
  if (has(text, /\b(candidates?|applicants?|interviews?)\b/)) return false;
  if (has(text, /\b(resumes?|cv|bullets?)\b/)) return true;
  return has(text, /\bkeywords?\b/) && has(text, /\bjob descriptions?\b/);
}

export function inboxCue(text: string): boolean {
  if (has(text, /\b(cold email|sales outreach|promo email|newsletter campaign)\b/)) return false;
  if (has(text, /\b(inbox|gmail)\b/)) return true;
  if (has(text, /\bemail threads?\b/)) return true;
  if (has(text, /\barchiv\w*\b/) && has(text, /\bnewsletters?\b/)) return true;
  return has(text, /\b(repl(?:y|ies|ied)|answer)\b/) && has(text, /\bemails?\b/);
}

export function imageCue(text: string): boolean {
  if (has(text, /\b(3d|mesh|meshes)\b/)) return false;
  if (has(text, /\b(text|image)[\s-]to[\s-]image\b/) || has(text, /\bimage prompts?\b/) || has(text, /\bconcept art\b/) || has(text, /\bmidjourney\b/)) {
    return true;
  }
  if (has(text, /\bpicture of\b/) || has(text, /\bimage of\b/) || has(text, /\bposter image\b/)) return true;
  return has(text, /\b(images?|pictures?|posters?)\b/)
    && has(text, /\b(prompts?|generate|generating|make|making|style|framing|change|changing)\b/);
}

export function meshCue(text: string): boolean {
  return has(text, /\b(3d|mesh(?:es)?)\b/);
}

export function codeCue(text: string): boolean {
  if (has(text, /\blegacy\b/) && has(text, /\bupgrades?\b/)) return true;
  return has(text, /\b(functions?|bugs?|diffs?|repos?|github|refactor|debug|debugging|stack traces?|pull requests?|null crash|code edits?)\b/);
}

export function billCue(text: string): boolean {
  return has(text, /\b(bills?|invoices?|payables?|accounts receivable|accounts payable)\b/) && !codeCue(text);
}

export function contentCue(text: string): boolean {
  if (has(text, /\b(listings?|mls|remarks)\b/)) return false;
  if (has(text, /\b(landing pages?|about pages?|help articles?|blog posts?|content briefs?|marketing pages?|marketing copy)\b/)) {
    return true;
  }
  if (has(text, /\bcontent for\b/)) return true;
  if (has(text, /\brewrit\w*\b/) && has(text, /\bparagraphs?\b/)) return true;
  return has(text, /\barticles?\b/) && has(text, /\b(claims?|outlines?|drafts?|rewrites?)\b/);
}

export function supportCue(text: string): boolean {
  if (has(text, /\b(wiki|handbook|intranet|sop|policy)\b/)) return false;
  if (has(text, /\b(customer support|support tickets?|support inbox|support issues?|help center|missing packages?)\b/)) return true;
  if (has(text, /\btell\b/) && has(text, /\bcustomers?\b/)) return true;
  return has(text, /\btickets?\b/) && has(text, /\b(customers?|shipping|packages?|orders?|refunds?)\b/);
}

export function helpdeskCue(text: string): boolean {
  if (has(text, /\bdo not type\b/)) return false;
  if (has(text, /\b(vpn|wifi|wi-fi|passwords?|help ?desks?|lockouts?|log ?ins?)\b/)) return true;
  if (has(text, /\bit (?:tickets?|support)\b/)) return true;
  if (has(text, /\blaptops?\b/) && has(text, /\b(slow|broken|wifi|wi-fi|passwords?)\b/)) return true;
  return has(text, /\b(monitors?|printers?)\b/) && has(text, /\b(broken|help desk|ticket)\b/);
}

export function dataCue(text: string): boolean {
  if (has(text, /\b(csv|spreadsheets?|dashboards?)\b/)) return true;
  if (has(text, /\b(columns?|tables?)\b/) && has(text, /\b(mean|reports?|totals?|data)\b/)) return true;
  if (has(text, /\btotals?\b/) && has(text, /\b(wrong|looks)\b/)) return true;
  return has(text, /\b(charts?|trends?)\b/) && has(text, /\b(data|revenue|sales|tables?|reports?)\b/);
}

export function followCue(text: string): boolean {
  if (has(text, /\b(schedul\w*|buyers?|sellers?|leads?|crm)\b/)) return false;
  if (has(text, /\b(check(?:\s|-)?ins?|thank(?:\s|-)?you|gone quiet|re-?engage)\b/)) return true;
  if (has(text, /\bthank\b/) && has(text, /\b(customers?|week|repeat)\b/)) return true;
  if (has(text, /\bnotes?\b/) && has(text, /\bcustomers?\b/)) return true;
  return has(text, /\bfollow(?:\s|-)?ups?\b/) && has(text, /\b(customers?|service|bought)\b/);
}

export function shopCue(text: string): boolean {
  if (has(text, /\b(shifts?|rosters?|rota|sop|wiki|policy|automate|automation)\b/) && !has(text, /\b(products?|buy|price)\b/)) {
    return false;
  }
  if (has(text, /\b(price comparisons?|warrant(?:y|ies)|product lists?|product recommendations?)\b/)) return true;
  if (has(text, /\bunder (?:my |the )?budget\b/)) return true;
  if (has(text, /\bspecs?\b/) && has(text, /\b(buy|models?)\b/)) return true;
  if (has(text, /\bdifference\b/) && has(text, /\bmodels?\b/)) return true;
  return has(text, /\b(buy|buying|shop|shopping|recommend|recommending|compare|comparing|choose|choosing)\b/)
    && has(text, /\b(laptops?|monitors?|desks?|cameras?|headphones?|chairs?|microphones?|carry-ons?|products?|models?)\b/);
}

export function knowledgeCue(text: string): boolean {
  if (has(text, /\b(page states|vacation rules?)\b/)) return true;
  return has(text, /\b(wikis?|handbooks?|intranets?|sops?|policies|policy|knowledge bases?|document q and a|standard operating)\b/);
}

export function socialCue(text: string): boolean {
  if (has(text, /\b(blog posts?|seo|marketing copy)\b/)) return false;
  if (has(text, /\b(clips?|reels?|highlights?|streams?|vods?|twitch)\b/) && !has(text, /\b(captions?|posts?|calendar)\b/)) return false;
  if (has(text, /\b(social media|social calendars?|content calendars?|comment repl(?:y|ies)|social posts?)\b/)) return true;
  if (has(text, /\bwhen should i post\b/) || has(text, /\bposts for next week\b/) || has(text, /\bthis week'?s posts\b/)) return true;
  if (has(text, /\breply to (?:this |the )?comments?\b/) || has(text, /\bcomment repl(?:y|ies)\b/)) return true;
  if (has(text, /\b(ideas|plan)\b/) && has(text, /\b(tiktok|instagram|facebook|linkedin)\b/)) return true;
  if (has(text, /\bthis weeks? posts\b/) || has(text, /\bdraft\b/) && has(text, /\bposts\b/)) return true;
  if (has(text, /\b(vods?|twitch|kick|livestreams?|streams?)\b/) && has(text, /\bcaptions?\b/)) return false;
  if (has(text, /\bcaptions?\b/) && !has(text, /\b(twitch|clips?|reels?|listings?|videos?|vods?|streams?|kick)\b/)) return true;
  return has(text, /\b(instagram|linkedin|tiktok|facebook|social)\b/)
    && has(text, /\b(captions?|posts?|calendars?|comments?)\b/);
}

export function securityCue(text: string): boolean {
  if (has(text, /\b(phish\w*|malware|ransomware|soc|threats?|false positives?)\b/)) return true;
  if (has(text, /\bsuspicious\b/) && has(text, /\b(emails?|headers?|links?)\b/)) return true;
  if (has(text, /\bverify\b/) && has(text, /\bclick\b/)) return true;
  return has(text, /\bclick\b/) && has(text, /\b(links?|emails?)\b/) && has(text, /\b(should|before)\b/);
}

export function researchCue(text: string): boolean {
  if (has(text, /\b(crawl\w*|chunks?|embed\w*|vectors?|rag)\b/)) return false;
  if (has(text, /\b(escrow|closings?|disclosures?|transactions?)\b/)) return false;
  if (has(text, /\baccounts?\b/) && has(text, /\bemails?\b/)) return false;
  if (has(text, /\bone agent\b/) && has(text, /\b(drafts?|researches|research)\b/)) return false;
  if (has(text, /\b(summaries|summary|stud(?:y|ies))\b/) && has(text, /\b(compare|sources?|research|claims?)\b/)) return true;
  return has(text, /\b(literature|citations?|papers|sources?|competitive landscapes?|competitive analysis|deep research|market research)\b/);
}

export function tutorCue(text: string): boolean {
  if (has(text, /\b(spanish|french|german|japanese|duolingo|languages?)\b/)) return false;
  if (has(text, /\bone concept at a time\b/)) return true;
  return has(text, /\b(tutors?|tutoring|homework|quiz me|practice problems|study plans?|algebra|photosynthesis|walk me through)\b/);
}

export function languageCue(text: string): boolean {
  if (has(text, /\b(spanish|french|german|japanese|duolingo|languages?|vocabulary|grammar)\b/)) return true;
  if (has(text, /\bdialogue\b/) && has(text, /\bpractice\b/) && !has(text, /\b(npc|game|quest)\b/)) return true;
  return has(text, /\bsentences?\b/) && has(text, /\b(wrong|correct|grammar)\b/) && !has(text, /\b(agreements?|contracts?)\b/);
}

export function voiceCue(text: string): boolean {
  if (has(text, /\b(avatar|spokesperson|npc|innkeeper|quest)\b/)) return false;
  if (has(text, /\b(tts|voiceovers?|voice overs?|narrations?|text to speech|text-to-speech|out loud)\b/)) return true;
  if (has(text, /\baudio\b/) && has(text, /\bscripts?\b/)) return true;
  return has(text, /\bspoken\b/) || (has(text, /\bread\b/) && has(text, /\b(aloud|loud)\b/));
}

export function ragCue(text: string): boolean {
  if (has(text, /\b(rag|retriev\w*|vectors?|chunks?|embed|embeddings?|passages?)\b/)) return true;
  return has(text, /\bsources?\b/) && has(text, /\b(sentences?|passages?|answers?)\b/);
}

export function crewCue(text: string): boolean {
  if (has(text, /\bhandoffs?\b/) && has(text, /\bagents?\b/)) return true;
  if (has(text, /\b(multi-agent|multi agent|agent crews?|across agents|second agent|several agents|between agents)\b/)) return true;
  if (has(text, /\bone agent\b/) && has(text, /\b(drafts?|researches)\b/)) return true;
  return has(text, /\bdrafts\b/) && has(text, /\bchecks\b/);
}

export function browserCue(text: string): boolean {
  if (has(text, /\b(browsers?|captchas?|click-paths?|web tasks?)\b/)) return true;
  if (has(text, /\b(click through|stop at the login|do not type|fill out)\b/)) return true;
  return has(text, /\bforms?\b/) && has(text, /\b(fill|fields|vendor)\b/);
}

export function npcCue(text: string): boolean {
  if (languageCue(text) && !has(text, /\b(npc|quest|innkeeper|game)\b/)) return false;
  if (has(text, /\bdialogue\b/) && !languageCue(text)) return true;
  if (has(text, /\blines?\b/) && has(text, /\bgame\b/)) return true;
  return has(text, /\b(npcs?|innkeepers?|quest givers?|game masters?)\b/)
    || (has(text, /\b(dialogue|character)\b/) && has(text, /\b(game|quest|innkeeper|guard|voice|lines?)\b/));
}

export function avatarCue(text: string): boolean {
  return has(text, /\b(avatars?|talking[-\s]?heads?|spokespersons?|without filming|on camera)\b/);
}

export function videoGenCue(text: string): boolean {
  if (has(text, /\b(clips?|reels?|highlights?|twitch|vods?|youtube shorts?)\b/)) return false;
  if (has(text, /\b(text|image)[\s-]to[\s-]video\b/) || has(text, /\bcinematic\b/) || has(text, /\bai videos?\b/)) return true;
  if (has(text, /\b(dolly|push-ins?|camera moves?)\b/)) return true;
  if (has(text, /\bvideo generation\b/) || has(text, /\bvideo prompts?\b/)) return true;
  return has(text, /\bvideos?\b/) && has(text, /\bprompts?\b/) && !has(text, /\b(listings?|propert(?:y|ies)|walkthroughs?)\b/);
}

export function workflowCue(text: string): boolean {
  if (crewCue(text)) return false;
  if (has(text, /\b(workflows?|automations?|zapier|n8n|repeated tasks?)\b/)) return true;
  if (has(text, /\bconnect\b/) && has(text, /\b(crms?|emails?|slack|sheets?|shopify|apps)\b/)) return true;
  if (has(text, /\bwhen a row is added\b/) || has(text, /\bstay manual\b/) || has(text, /\bautomate the handoff\b/)) return true;
  return has(text, /\bevery monday\b/) && has(text, /\btasks?\b/);
}

export function salesCue(text: string): boolean {
  if (ragCue(text) || has(text, /\b(taxable|exempt|gst|vat|csv|spreadsheets?)\b/)) return false;
  if (has(text, /\baccounts?\b/) && has(text, /\b(emails?|research)\b/)) return true;
  return has(text, /\b(cold emails?|sales outreach|qualify leads)\b/);
}

export function taxCue(text: string): boolean {
  return has(text, /\b(deductions?|deduct|1040|write-?offs?)\b/) && !has(text, /\b(sales tax|gst|vat|taxable)\b/);
}

export function salesTaxCue(text: string): boolean {
  return has(text, /\b(sales taxes?|gst|vat|taxable|exempt)\b/);
}

export function payCue(text: string): boolean {
  if (has(text, /\b(deductions?|deduct)\b/) && has(text, /\b(paid|pay|payroll)\b/)) return true;
  if (has(text, /\b(payroll|paychecks?|paystubs?|overtime|timesheets?|pay rates?|gross pay|pay dates?)\b/)) return true;
  return has(text, /\bhours\b/) && has(text, /\b(rates?|pay|wages)\b/);
}

export function shiftCue(text: string): boolean {
  if (has(text, /\b(meetings?|appointments?|calls?)\b/)) return false;
  if (has(text, /\b(shifts?|rota|rosters?)\b/)) return true;
  if (has(text, /\b(staff|employees)\b/) && has(text, /\bshifts?\b/)) return true;
  if (has(text, /\bnobody assigned\b/)) return true;
  return DAY.test(text) && has(text, /\b(who can work|can work|available|roster|staff|salon|assigned)\b/);
}

export function hireCue(text: string): boolean {
  return has(text, /\b(hiring|interviews?|job descriptions?|candidates?|applicants?|screen|onboard\w*|recruit\w*)\b/);
}

export function reviewCue(text: string): boolean {
  if (has(text, /\b(resumes?|cvs?|diffs?|pull requests?|candidates?|codes?)\b/)) return false;
  if (has(text, /\b(google reviews?|one-star|public reviews?|review asks?|review requests?)\b/)) return true;
  return has(text, /\breviews?\b/) && has(text, /\b(stars?|rewards?|customers?|google|public|ask)\b/);
}

export function contractCue(text: string): boolean {
  if (has(text, /\b(escrow|closings?|disclosures?|transactions?)\b/)) return false;
  if (has(text, /\b(contracts?|agreements?|lawyers?)\b/)) return true;
  return has(text, /\b(sign|signs)\b/) && has(text, /\b(not|before|yet|anyone)\b/);
}

export function quoteCue(text: string): boolean {
  if (has(text, /\b(list price|listing price|cma|comps?|homes?|houses?)\b/)) return false;
  if (has(text, /\b(quotes?|proposals?|estimates?)\b/)) return true;
  if (has(text, /\bprices?\b/) && has(text, /\b(set|jobs?|scopes?|expires?|expire)\b/) && !has(text, /\b(products?|headphones?|homes?|houses?)\b/)) {
    return true;
  }
  return false;
}

export function promoCue(text: string): boolean {
  return has(text, /\b(campaigns?|subscribers?|coupons?|discounts?|promos?|announce the sale)\b/);
}

export function meetingCue(text: string): boolean {
  if (has(text, /\b(transcripts?|action items?|we decide|decided)\b/)) return true;
  if (has(text, /\bcalls?\b/) && has(text, /\b(tasks?|notes?)\b/)) return true;
  return has(text, /\bdecisions?\b/) && has(text, /\bcomments?\b/);
}

export function scheduleCue(text: string): boolean {
  if (shiftCue(text) || socialCue(text) || followCue(text)) return false;
  if (has(text, /\bmove\b/) && has(text, /\bmeetings?\b/)) return true;
  return has(text, /\b(remind me|booking links?|find a time|intro calls?|reminders?)\b/);
}

export function travelCue(text: string): boolean {
  if (languageCue(text) && !has(text, /\b(flights?|hotels?|itinerary|stay)\b/)) return false;
  if (has(text, /\b(expense reports?|invoices?)\b/)) return false;
  if (knowledgeCue(text) || has(text, /\b(markets?|stats|statistics|housing|reports?)\b/)) return false;
  return has(text, /\b(trips?|itinerary|flights?|hotels?|vacations?|where to stay|neighborhoods?)\b/);
}

const CUES: Record<string, (text: string) => boolean> = {
  resume: resumeCue,
  email: inboxCue,
  image: imageCue,
  "three-d": meshCue,
  code: codeCue,
  invoices: billCue,
  content: contentCue,
  support: supportCue,
  helpdesk: helpdeskCue,
  data: dataCue,
  "customer-follow-up": followCue,
  shopping: shopCue,
  knowledge: knowledgeCue,
  social: socialCue,
  security: securityCue,
  research: researchCue,
  tutoring: tutorCue,
  language: languageCue,
  voice: voiceCue,
  rag: ragCue,
  crew: crewCue,
  browser: browserCue,
  npc: npcCue,
  avatar: avatarCue,
  "video-generation": videoGenCue,
  workflow: workflowCue,
  sales: salesCue,
  taxes: taxCue,
  "sales-tax": salesTaxCue,
  contracts: contractCue,
  quotes: quoteCue,
  hiring: hireCue,
  reviews: reviewCue,
  promotions: promoCue,
  meetings: meetingCue,
  payroll: payCue,
  shifts: shiftCue,
  schedule: scheduleCue,
  travel: travelCue,
};

export function jobCueBonus(id: string, text: string): number {
  const cue = CUES[id];
  return cue && cue(text) ? 12 : 0;
}

/** True when this concept must not win because another job owns the wording. */
export function jobCueBlocks(id: string, text: string): boolean {
  if (id === "video" && (socialCue(text) || languageCue(text) || voiceCue(text) || videoGenCue(text) || followCue(text) || avatarCue(text))) {
    return true;
  }
  if (id === "sales" && (ragCue(text) || salesTaxCue(text) || dataCue(text) || workflowCue(text))) return true;
  if (id === "sales" && has(text, /\b(hiring|interviews?|candidates?|job descriptions?|campaigns?|subscribers?|coupons?|promos?)\b/)) return true;
  if (id === "hiring" && has(text, /\b(parcels?|acreage|zoning|zoned|lots?)\b/)) return true;
  if (id === "quotes" && (ragCue(text) || has(text, /\b(list price|listing price|value range)\b/))) return true;
  if (id === "code" && billCue(text) && !codeCue(text)) return true;
  if (id === "research" && (salesCue(text) || crewCue(text) || ragCue(text))) return true;
  if (id === "schedule" && (socialCue(text) || billCue(text) || shiftCue(text) || inboxCue(text))) return true;
  if (id === "schedule" && has(text, /\b(campaigns?|promos?|coupons?|newsletters?|subscribers?)\b/)) return true;
  if (id === "shopping" && (shiftCue(text) || knowledgeCue(text) || helpdeskCue(text) || workflowCue(text))) return true;
  if (id === "helpdesk" && (shopCue(text) || browserCue(text))) return true;
  if (id === "travel" && (languageCue(text) || knowledgeCue(text))) return true;
  if (id === "invoices" && (dataCue(text) || knowledgeCue(text) || workflowCue(text))) return true;
  if (id === "newsletter" && has(text, /\barchiv\w*\b/)) return true;
  if (id === "meetings" && travelCue(text) && !has(text, /\b(transcripts?|action items|notes)\b/)) return true;
  if (id === "meetings" && has(text, /\bmove\b/) && has(text, /\bmeetings?\b/) && !has(text, /\b(transcripts?|notes|action items)\b/)) {
    return true;
  }
  if (id === "voice" && (npcCue(text) || avatarCue(text))) return true;
  if (id === "tutoring" && languageCue(text)) return true;
  if (id === "books-reports" && shopCue(text)) return true;
  if (id === "support" && knowledgeCue(text)) return true;
  if (id === "knowledge" && ragCue(text)) return true;
  if (id === "commerce" && (supportCue(text) || has(text, /\btickets?\b/))) return true;
  if (id === "email" && has(text, /\bsupport\b/)) return true;
  if (id === "taxes" && payCue(text)) return true;
  if (id === "prospecting" && quoteCue(text)) return true;
  if (
    id === "hiring"
    && resumeCue(text)
    && !has(text, /\b(candidates?|applicants?|interviews?|screen|onboard\w*|recruit\w*|hiring)\b/)
  ) return true;
  if (id === "content" && socialCue(text)) return true;
  if (id === "language" && has(text, /\b(listings?|mls|remarks|propert(?:y|ies))\b/)) return true;
  if (id === "resume" && has(text, /\b(listings?|mls|backyards?|propert(?:y|ies)|remarks)\b/)) return true;
  return false;
}

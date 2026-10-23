/**
 * Small-business jobs: bookkeeping brands, payroll, tax, and the other
 * searches an owner actually types. Matching stays in the lexicon. Copy
 * states only what the directory, or the tool's own site, supports.
 */

export const SMB_SPELLING: Record<string, string> = {
  quickbok: "quickbooks",
  quickboks: "quickbooks",
  quickbook: "quickbooks",
  quikbooks: "quickbooks",
  quikbook: "quickbooks",
  bookeeping: "bookkeeping",
  bookeping: "bookkeeping",
  bookeeper: "bookkeeper",
  catagorize: "categorize",
  catagorizing: "categorizing",
  catagorized: "categorized",
  reciept: "receipt",
  reciepts: "receipts",
  invioce: "invoice",
  inviocs: "invoices",
  payrol: "payroll",
  freshbok: "freshbooks",
  newletter: "newsletter",
  newsltter: "newsletter",
  shopfy: "shopify",
};

const BRAND_CASE: Record<string, string> = {
  quickbooks: "QuickBooks",
  freshbooks: "FreshBooks",
  xero: "Xero",
  shopify: "Shopify",
  etsy: "Etsy",
  zoho: "Zoho",
  wave: "Wave",
  qbo: "QBO",
  sop: "SOP",
  sops: "SOPs",
};

export function brandCase(word: string): string | null {
  return BRAND_CASE[word.toLowerCase().replace(/[^a-z0-9]/g, "")] ?? null;
}

export function propertyMoneyQuery(text: string): boolean {
  return /\b(houses?|homes?|rentals?|propert(?:y|ies)|flips?|parcels?|real estate|deals?)\b/i.test(text);
}

export function portfolioQuery(text: string): boolean {
  return /\b(portfolios?|stocks?|etfs?|401k|brokerage|investments?|investing)\b/i.test(text);
}

export function salesTaxQuery(text: string): boolean {
  return /\bsales tax\b/i.test(text) || /\bvat\b/i.test(text);
}

export function payrollQuery(text: string): boolean {
  return /\bpayroll\b/i.test(text) || /\bpaychecks?\b/i.test(text) || /\bpaystubs?\b/i.test(text);
}

export function shiftQuery(text: string): boolean {
  return /\b(shifts?|rota|rosters?)\b/i.test(text)
    || /\b(staff|employee|team)\s+schedule\b/i.test(text);
}

export function quickBooksQuery(text: string): boolean {
  return /\bqbo\b/i.test(text) || /quick\s*books/i.test(text);
}

export function xeroQuery(text: string): boolean {
  return /\bxero\b/i.test(text);
}

export function freshBooksQuery(text: string): boolean {
  return /fresh\s*books/i.test(text);
}

export function zohoBooksQuery(text: string): boolean {
  return /zoho books/i.test(text);
}

export function waveAccountingQuery(text: string): boolean {
  return /wave accounting/i.test(text) || /\bwave books\b/i.test(text);
}

export function booksBrandQuery(text: string): boolean {
  return quickBooksQuery(text) || xeroQuery(text) || freshBooksQuery(text) || zohoBooksQuery(text) || waveAccountingQuery(text);
}

export function reconcileQuery(text: string): boolean {
  return /reconcil/i.test(text);
}

export function categorizeQuery(text: string): boolean {
  return /categoriz/i.test(text);
}

export function accountantQuery(text: string): boolean {
  return /\baccountants?\b/i.test(text) || /\bbookkeepers?\b/i.test(text);
}

export function receivableQuery(text: string): boolean {
  const lower = text.toLowerCase();
  if (/\bbill(?:ing)?\s+(?:clients|customers)\b/.test(lower)) return true;
  if (/\b(?:customer|client)\s+invoices?\b/.test(lower)) return true;
  if (/\b(?:send|sending)\b/.test(lower) && /\binvoic/.test(lower)) return true;
  if (/\b(?:overdue|past due|late payments?|get paid|getting paid|paid faster)\b/.test(lower)) return true;
  if (/\bchas(?:e|ing)\b/.test(lower) && /\b(?:invoices?|payments?)\b/.test(lower)) return true;
  if (/\bsubscription billing\b/.test(lower) || /\brecurring invoices?\b/.test(lower)) return true;
  return false;
}

export function adsQuery(text: string): boolean {
  return /\b(ads|ad creative|ad creatives|facebook ads|google ads|instagram ads)\b/i.test(text);
}

export function newsletterQuery(text: string): boolean {
  return /\bnewsletters?\b/i.test(text);
}

export function localSeoQuery(text: string): boolean {
  return /\blocal seo\b/i.test(text) || /\bgoogle business(?: profile)?\b/i.test(text) || /\bbusiness profile\b/i.test(text);
}

export function phoneQuery(text: string): boolean {
  return /\b(phones?|calls?|callers?)\b/i.test(text);
}

export function cashReportQuery(text: string): boolean {
  return /\b(cash flow|profit and loss|p&l|p and l|financial dashboards?|budgets?|budgeting|forecasts?|forecasting)\b/i.test(text);
}

export function appointmentQuery(text: string): boolean {
  return /\bappointments?\b/i.test(text) || /\bno-?shows?\b/i.test(text);
}

export function commerceQuery(text: string): boolean {
  return /\b(shopify|etsy|inventory|ecommerce|e-commerce)\b/i.test(text)
    || /\bamazon\s+(?:store|seller)\b/i.test(text)
    || /\bsell on amazon\b/i.test(text)
    || /\bshipping labels?\b/i.test(text)
    || /\bship orders\b/i.test(text);
}

/** Concepts that must not win for this wording. */
export function conceptBlocked(id: string, lower: string): boolean {
  if (id === "taxes" && (salesTaxQuery(lower) || payrollQuery(lower))) return true;
  if (id === "schedule" && shiftQuery(lower)) return true;
  if (id === "books-reports") {
    if (propertyMoneyQuery(lower) || portfolioQuery(lower)) return true;
    if (/\b(trips?|travel|vacations?|hotels?|flights?)\b/.test(lower)) return true;
    if (/\bsales\b/.test(lower) && !/\b(cash|profit|budget|expense|p&l)\b/.test(lower)) return true;
  }
  if (id === "bookkeeping") {
    if (/\b(photos?|images?|videos?)\b/.test(lower)) return true;
    if (/\b(book club|novel|novels|library)\b/.test(lower)) return true;
    if (/\b(file|filing|1040)\b/.test(lower) && /\btax/.test(lower)) return true;
  }
  if (id === "commerce" && /\b(promo|promos|promotion|newsletter)\b/.test(lower) && !/\b(inventory|shipping|orders)\b/.test(lower)) {
    return true;
  }
  if (id === "shopping" && /\b(etsy|shopify|inventory|ecommerce|e-commerce)\b/.test(lower)) return true;
  if (id === "shopping" && /\bamazon\s+(?:store|seller)\b/.test(lower)) return true;
  return false;
}

export function smallBusinessHeader(cleaned: string): string | null {
  const lower = cleaned.toLowerCase();
  const cleanup = /\b(clean|cleanup|messy|catch|behind|reconcil|categoriz)\b/.test(lower);
  if (quickBooksQuery(lower)) {
    if (cleanup) return "cleaning up your QuickBooks";
    if (/\bqbo\b/.test(lower) && !/quick\s*books/.test(lower)) return "help with QBO";
    return "help with QuickBooks";
  }
  if (freshBooksQuery(lower)) return cleanup ? "cleaning up your FreshBooks" : "help with FreshBooks";
  if (xeroQuery(lower)) return cleanup ? "cleaning up your Xero" : "help with Xero";
  if (zohoBooksQuery(lower)) return cleanup ? "cleaning up your Zoho books" : "help with Zoho books";
  if (waveAccountingQuery(lower)) return cleanup ? "cleaning up your Wave books" : "help with Wave";
  if (salesTaxQuery(lower)) return "handling sales tax";
  if (shiftQuery(lower)) return "scheduling staff shifts";
  if (payrollQuery(lower) && contentCount(lower) <= 2) return "running payroll";
  if (/\b(?:get paid|getting paid|paid faster)\b/.test(lower)) return "getting paid faster";
  if (/\bsubscription billing\b/.test(lower) || /\brecurring invoices?\b/.test(lower)) return "sending recurring invoices";
  if (/\b(?:year-?end|tax prep)\b/.test(lower)) return "preparing year-end taxes";
  if (localSeoQuery(lower)) {
    if (/\bgoogle business|\bbusiness profile\b/.test(lower)) return "drafting a Google business profile";
    return "help with local SEO";
  }
  if (newsletterQuery(lower)) return "sending an email newsletter";
  if (/\b(sops?|standard operating)\b/.test(lower)) return "writing an SOP";
  if (/\bcash flow\b/.test(lower)) return "reading your cash flow";
  if (/\bprofit and loss\b|\bp&l\b|\bp and l\b/.test(lower)) return "reading your profit and loss";
  if (/\bfinancial dashboards?\b/.test(lower)) return "reading a financial dashboard";
  if (/\b(?:budget|forecast)/.test(lower)) return "forecasting cash flow";
  if (appointmentQuery(lower)) {
    if (/\bno-?shows?\b/.test(lower)) return "handling no-shows";
    return "booking appointments";
  }
  if (/\bfaq\b|\bchatbots?\b/.test(lower)) return "answering website questions";
  if (/\bproject management\b|\btask management\b|\btask list\b|\bto-?do list\b/.test(lower)) return "managing projects";
  if (/^(?:your\s+)?social posts?$/.test(lower.trim())) return "creating social posts";
  if (/^overdue invoices?$/.test(lower.trim())) return "chasing overdue invoices";
  if (/^invoices?\b/.test(lower.trim())) return `sending ${lower.trim()}`;
  if (/\bsell on amazon\b/.test(lower)) return "selling on Amazon";
  if (/\b(?:quotes?|proposals?)\b/.test(lower)) return "drafting a quote";
  if (/\b(?:small business|whole business)\b/.test(lower) && /\b(?:what should|automat)/.test(lower)) {
    return "running a small business";
  }
  if (/\bbookkeeping\b/.test(lower)) return "help with bookkeeping";
  if (/\b(?:my|your|the|messy) books\b/.test(lower)) return "help with the books";
  return null;
}

function contentCount(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 2).length;
}

const BOOKS_INTRO = "AI agents can capture receipts, sort expenses into categories, and gather the records you review before they go back into the books.";
const QB_INTRO = "AI agents can capture receipts and expenses and publish the ones you approve into QuickBooks. You still decide what hits the books.";
const XERO_INTRO = "AI agents can capture receipts and expenses and sync the records you approve to Xero. You still decide what hits the books.";
const FRESHBOOKS_INTRO = "AI agents can capture receipts and expenses, and BILL can export and import invoice data with FreshBooks. You still decide what gets entered.";
const ZOHO_INTRO = "AI agents can capture receipts and expenses, and Ramp can connect card expenses to Zoho books. You still decide what gets entered.";
const CHATBOT_INTRO = "AI agents can answer repeated questions on the site and hand the rest to a person. You still decide which questions they may answer.";
const PROJECT_INTRO = "AI agents can turn a project into a task list and propose times to do the work. You still decide what gets done first.";
const RECONCILE_INTRO = "AI agents can gather the receipts and card charges that belong on a bank or credit-card reconciliation. You still match each line to the statement.";
const QB_RECONCILE_INTRO = "AI agents can pull receipts and card charges into QuickBooks and line them up against the statement. You still confirm each match.";
const CATEGORIZE_INTRO = "AI agents can read a receipt or a card charge and suggest a category for the books. You still correct the ones that look wrong.";
const ACCOUNTANT_INTRO = "AI agents can organize receipts and expenses into a packet you can hand to your accountant. You still confirm the numbers.";
const CATCHUP_INTRO = "AI agents can pull receipts and expenses into one pile so catching up on messy books starts from complete records. You still decide what gets entered.";
const GET_PAID_INTRO = "AI agents can send the invoice, list which ones are still unpaid, and draft the reminder. You still approve the amount and the note that goes out.";
const QUARTERLY_INTRO = "AI agents can list the quarterly dates, sort the income and expenses you still verify, and carry the totals into a filing product. You still decide what gets filed.";
const TEN99_INTRO = "AI agents can list contractor payments and the questions a 1099 still needs. You confirm every amount before anything is filed.";
const YEAREND_INTRO = "AI agents can gather year-end income, expenses, and receipts into a packet for the return. You still decide what gets filed.";
const CASH_INTRO = "AI agents can read a spreadsheet of income and expenses and draft a cash-flow or profit-and-loss summary. You recompute the totals before you trust them.";
const LOCAL_SEO_INTRO = "AI agents can draft the local page and the Google business profile description. You still publish it and check the hours and the address.";
const ADS_INTRO = "AI agents can draft the ad creative and the caption. You still choose the budget and where it runs.";
const PHONE_INTRO = "AI agents can handle a customer conversation by chat, email, or voice and hand off the calls a person should take.";
const APPOINTMENT_INTRO = "AI agents can offer a scheduling link, hold the appointment on a calendar, and draft a reminder. You still confirm who is coming.";
const COMMERCE_INTRO = "AI agents can connect the store, order, and shipping apps you already use and pass a step from one app to the next. You still confirm the count and the label.";
const NEWSLETTER_INTRO = "AI agents can draft an email newsletter and a subject line for the list you already have. You still approve the send.";
const SOP_INTRO = "AI agents can draft a standard operating procedure and file it where the team can search it. You still correct the steps.";

export function smallBusinessIntro(query: string, useCaseSlug: string | undefined, conceptId: string | null): string | null {
  const text = query.toLowerCase();
  if (conceptId === "commerce" || (useCaseSlug === "workflow-automation" && commerceQuery(text) && conceptId !== "workflow")) {
    return COMMERCE_INTRO;
  }
  if (useCaseSlug === "bookkeeping" || conceptId === "bookkeeping") {
    if (quickBooksQuery(text) && reconcileQuery(text)) return QB_RECONCILE_INTRO;
    if (quickBooksQuery(text)) return QB_INTRO;
    if (xeroQuery(text)) return XERO_INTRO;
    if (freshBooksQuery(text)) return FRESHBOOKS_INTRO;
    if (zohoBooksQuery(text)) return ZOHO_INTRO;
    if (reconcileQuery(text)) return RECONCILE_INTRO;
    if (categorizeQuery(text)) return CATEGORIZE_INTRO;
    if (accountantQuery(text)) return ACCOUNTANT_INTRO;
    if (/\b(messy|mess|catch up|behind on)\b/.test(text)) return CATCHUP_INTRO;
    return BOOKS_INTRO;
  }
  if (useCaseSlug === "finance-ops" && /\bexpense reports?\b/.test(text)) {
    return "AI agents can collect receipts and card charges into an expense report you still approve. You correct the category before it is filed.";
  }
  if (useCaseSlug === "finance-ops" && receivableQuery(text)) return GET_PAID_INTRO;
  if ((useCaseSlug === "hire-candidates" || conceptId === "hiring") && /\bonboard/.test(text)) {
    return "AI agents can draft an onboarding checklist and the first notes for a new hire. You still decide who starts.";
  }
  if (useCaseSlug === "do-taxes") {
    if (/\b1099/.test(text)) return TEN99_INTRO;
    if (/\bquarterly\b|\bestimated tax/.test(text)) return QUARTERLY_INTRO;
    if (/\byear-?end\b|\btax prep/.test(text)) return YEAREND_INTRO;
  }
  if (cashReportQuery(text) && (useCaseSlug === "analyze-data" || conceptId === "books-reports")) return CASH_INTRO;
  if (localSeoQuery(text) && (useCaseSlug === "create-content" || conceptId === "content")) return LOCAL_SEO_INTRO;
  if (adsQuery(text) && (useCaseSlug === "social-media" || conceptId === "social")) return ADS_INTRO;
  if (/\b(?:faq|chatbots?)\b/.test(text) && (useCaseSlug === "customer-support" || conceptId === "support")) return CHATBOT_INTRO;
  if (phoneQuery(text) && (useCaseSlug === "customer-support" || conceptId === "support")) return PHONE_INTRO;
  if (/\b(?:project management|task management|task list|to-?do list)\b/.test(text) && (useCaseSlug === "scheduling-assistant" || conceptId === "schedule")) {
    return PROJECT_INTRO;
  }
  if (appointmentQuery(text) && (useCaseSlug === "scheduling-assistant" || conceptId === "schedule")) return APPOINTMENT_INTRO;
  if (newsletterQuery(text) && (conceptId === "newsletter" || useCaseSlug === "marketing-promotions")) return NEWSLETTER_INTRO;
  if (/\b(sops?|standard operating)\b/.test(text) && (useCaseSlug === "knowledge-qa" || conceptId === "knowledge")) return SOP_INTRO;
  return null;
}

const QB_LINES: Record<string, string> = {
  dext: "Dext publishes receipts and invoices into QuickBooks after you review each one.",
  ramp: "Ramp keeps QuickBooks updated with card expenses and the attached receipts.",
  "bill-com": "BILL keeps QuickBooks updated with invoices and bills.",
};

const QB_RECONCILE_LINES: Record<string, string> = {
  dext: "Dext codes receipts to the QuickBooks categories so a reconciliation starts from those records.",
  ramp: "Ramp checks card balances against QuickBooks with its reconciliation tool.",
  "bill-com": "BILL keeps QuickBooks updated with payments so a reconciliation starts from those records.",
};

const XERO_LINES: Record<string, string> = {
  dext: "Dext publishes receipts and invoices into Xero after you review each one.",
  ramp: "Ramp keeps Xero updated with card expenses.",
  "bill-com": "BILL keeps Xero updated with invoices and bills.",
};

const FRESHBOOKS_LINES: Record<string, string> = {
  "bill-com": "BILL exports and imports invoice data with FreshBooks.",
};

const ZOHO_LINES: Record<string, string> = {
  ramp: "Ramp connects card expenses to Zoho books.",
};

const RECONCILE_LINES: Record<string, string> = {
  dext: "Dext gathers receipts and invoices you can match to a bank or card statement.",
  ramp: "Ramp lists card charges you can match to a bank or card statement.",
  "bill-com": "BILL lists bills and payments you can match to a bank statement.",
};

const CATEGORIZE_LINES: Record<string, string> = {
  dext: "Dext reads a receipt and assigns a category you can correct before the books update.",
  ramp: "Ramp codes card expenses into categories for the books.",
  "bill-com": "BILL codes spend into categories next to the bills it pays.",
};

const ACCOUNTANT_LINES: Record<string, string> = {
  dext: "Dext gathers receipts and invoices into one inbox you can share with an accountant.",
  ramp: "Ramp keeps card charges and receipts together for the packet an accountant reviews.",
  "bill-com": "BILL keeps invoices and bills in one product an accountant can review.",
};

const BOOKS_LINES: Record<string, string> = {
  dext: "Dext captures receipts and invoices so the books have the source documents in one place.",
  ramp: "Ramp keeps card charges and expenses together for the books.",
  "bill-com": "BILL sends invoices and tracks bills next to the books.",
};

const GET_PAID_LINES: Record<string, string> = {
  "bill-com": "BILL sends customer invoices and records the payments that come back.",
  dext: "Dext captures the sales invoices so the amounts you bill sit in one inbox.",
};

const NEWSLETTER_LINES: Record<string, string> = {
  klaviyo: "Klaviyo sends email campaigns and drafts a subject line for a newsletter.",
  mailchimp: "Mailchimp sends an email newsletter to the contacts on a list.",
};

const CASH_LINES: Record<string, string> = {
  julius: "Julius answers questions about the data in a cash-flow or profit-and-loss spreadsheet.",
  rows: "Rows totals a spreadsheet of income and expenses into a report you can check.",
  hex: "Hex charts financial data in a shared notebook so the report starts from the sheet.",
};

const LOCAL_SEO_LINES: Record<string, string> = {
  jasper: "Jasper drafts marketing content, including the words for a local page or a Google business profile.",
  "copy-ai": "Copy.ai drafts marketing content you can paste into a local page or a business profile.",
  writesonic: "Writesonic writes content for a local page and tracks where the brand is mentioned.",
};

function pick(table: Record<string, string>, slug: string): string | null {
  return table[slug] ?? null;
}

export function smallBusinessSpecialistLine(useCaseSlug: string, toolSlug: string, query: string): string | null {
  const text = query.toLowerCase();
  if (useCaseSlug === "bookkeeping") {
    if (quickBooksQuery(text) && reconcileQuery(text)) return pick(QB_RECONCILE_LINES, toolSlug) ?? pick(QB_LINES, toolSlug);
    if (quickBooksQuery(text)) return pick(QB_LINES, toolSlug);
    if (xeroQuery(text)) return pick(XERO_LINES, toolSlug) ?? pick(BOOKS_LINES, toolSlug);
    if (freshBooksQuery(text)) return pick(FRESHBOOKS_LINES, toolSlug) ?? pick(BOOKS_LINES, toolSlug);
    if (zohoBooksQuery(text)) return pick(ZOHO_LINES, toolSlug) ?? pick(BOOKS_LINES, toolSlug);
    if (reconcileQuery(text)) return pick(RECONCILE_LINES, toolSlug);
    if (categorizeQuery(text)) return pick(CATEGORIZE_LINES, toolSlug);
    if (accountantQuery(text)) return pick(ACCOUNTANT_LINES, toolSlug);
    return pick(BOOKS_LINES, toolSlug);
  }
  if (useCaseSlug === "finance-ops" && receivableQuery(text)) return pick(GET_PAID_LINES, toolSlug);
  if (useCaseSlug === "marketing-promotions" && newsletterQuery(text)) return pick(NEWSLETTER_LINES, toolSlug);
  if (useCaseSlug === "analyze-data" && cashReportQuery(text)) return pick(CASH_LINES, toolSlug);
  if (useCaseSlug === "create-content" && localSeoQuery(text)) return pick(LOCAL_SEO_LINES, toolSlug);
  return null;
}

const ASK: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  perplexity: "Perplexity",
  deepseek: "DeepSeek",
};

function ask(slug: string, table: Record<string, string>): string | null {
  const name = ASK[slug];
  const tail = table[slug];
  return name && tail ? `Ask ${name} ${tail}` : null;
}

export function smallBusinessAssistantLine(slug: string, useCaseSlug: string | undefined, query: string): string | null {
  const text = query.toLowerCase();
  if (useCaseSlug === "bookkeeping" && xeroQuery(text)) {
    return ask(slug, {
      claude: "to list which Xero transactions still need a receipt or a category.",
      chatgpt: "for a Xero cleanup checklist of statements, receipts, and uncategorized expenses.",
      gemini: "to build a sheet of Xero transactions, the category, and whether a receipt is attached.",
      perplexity: "for sourced steps on reconciling Xero to a bank statement, with links you can check.",
      deepseek: "to flag which Xero lines you should ask an accountant about.",
    });
  }
  if (useCaseSlug === "bookkeeping" && freshBooksQuery(text)) {
    return ask(slug, {
      claude: "to list which FreshBooks entries still need a receipt or a category.",
      chatgpt: "for a FreshBooks checklist of invoices, receipts, and uncategorized expenses.",
      gemini: "to build a sheet of FreshBooks invoices, the amount, and whether a receipt is attached.",
      perplexity: "for sourced steps on a FreshBooks cleanup, with links you can check.",
      deepseek: "to flag which FreshBooks lines you should ask an accountant about.",
    });
  }
  if (useCaseSlug === "bookkeeping" && zohoBooksQuery(text)) {
    return ask(slug, {
      claude: "to list which Zoho books entries still need a receipt or a category.",
      chatgpt: "for a checklist of Zoho books expenses, receipts, and open invoices.",
      gemini: "to build a sheet of Zoho books transactions, the category, and whether a receipt is attached.",
      perplexity: "for sourced steps on a Zoho books cleanup, with links you can check.",
      deepseek: "to flag which Zoho books lines you should ask an accountant about.",
    });
  }
  if (useCaseSlug === "bookkeeping" && waveAccountingQuery(text)) {
    return ask(slug, {
      claude: "to list which Wave entries still need a receipt or a category.",
      chatgpt: "for a Wave checklist of invoices, receipts, and uncategorized expenses.",
      gemini: "to build a sheet of Wave transactions, the category, and whether a receipt is attached.",
      perplexity: "for sourced steps on cleaning up Wave, with links you can check.",
      deepseek: "to flag which Wave lines you should ask an accountant about.",
    });
  }
  if (useCaseSlug === "bookkeeping" && quickBooksQuery(text)) {
    return ask(slug, {
      claude: "to list which QuickBooks transactions still need a receipt or a category.",
      chatgpt: "for a QuickBooks cleanup checklist of statements, receipts, and uncategorized expenses.",
      gemini: "to build a sheet of QuickBooks transactions, the category, and whether a receipt is attached.",
      perplexity: "for sourced steps on reconciling QuickBooks to a bank statement, with links you can check.",
      deepseek: "to flag which QuickBooks lines you should ask an accountant about.",
    });
  }
  if (useCaseSlug === "bookkeeping" && categorizeQuery(text)) {
    return ask(slug, {
      claude: "to suggest a category for each transaction and mark the ones you should correct.",
      chatgpt: "for a checklist of transaction categories a small business usually uses.",
      gemini: "to build a sheet of transactions, a suggested category, and whether you approved it.",
      perplexity: "for sourced notes on expense categories, with links you can check.",
      deepseek: "to flag transactions whose category does not match the receipt.",
    });
  }
  if (useCaseSlug === "bookkeeping" && reconcileQuery(text)) {
    return ask(slug, {
      claude: "to list the statement lines that still need a receipt before you reconcile.",
      chatgpt: "for a reconciliation checklist of the statement, the receipts, and the unmatched lines.",
      gemini: "to build a sheet of statement lines, the amount, and whether a receipt is attached.",
      perplexity: "for sourced steps on a bank reconciliation, with links you can check.",
      deepseek: "to point at statement lines that do not have a matching receipt.",
    });
  }
  if (useCaseSlug === "finance-ops" && /\bexpense reports?\b/.test(text)) {
    return ask(slug, {
      claude: "to list the receipts an expense report is still missing.",
      chatgpt: "for a checklist of the date, the amount, and the category on an expense report.",
      gemini: "to build a sheet of expenses, the receipt, and whether the report is approved.",
      perplexity: "for sourced notes on what an expense report should include, with links you can check.",
      deepseek: "to flag expense lines that do not have a receipt.",
    });
  }
  if (useCaseSlug === "finance-ops" && receivableQuery(text)) {
    return ask(slug, {
      claude: "to list unpaid invoices and draft a short reminder you still approve.",
      chatgpt: "for a checklist of invoice number, due date, and who has not paid.",
      gemini: "to build a sheet of open invoices, the amount, and the last reminder.",
      perplexity: "for sourced notes on invoice payment terms, with links you can check.",
      deepseek: "to draft a late-payment note that states the amount and the due date.",
    });
  }
  if (useCaseSlug === "create-content" && localSeoQuery(text)) {
    return ask(slug, {
      claude: "to draft a Google business profile description and mark the hours you must confirm.",
      chatgpt: "for a checklist of the business name, hours, services, and address to verify.",
      gemini: "to build a sheet of local pages, the target phrase, and whether the draft is approved.",
      perplexity: "for sourced notes on local pages, with links you can check before you publish.",
      deepseek: "to shorten a business description so it states the service and the city.",
    });
  }
  if (useCaseSlug === "marketing-promotions" && newsletterQuery(text)) {
    return ask(slug, {
      claude: "to draft an email newsletter and mark the lines you still want to change.",
      chatgpt: "for a checklist of the subject line, the offer, and the list a newsletter goes to.",
      gemini: "to build a sheet of newsletter drafts, the subject, and whether the send is approved.",
      perplexity: "for sourced notes on email newsletter timing, with links you can check.",
      deepseek: "to shorten a newsletter so it states one offer and the next step.",
    });
  }
  if (useCaseSlug === "social-media" && adsQuery(text)) {
    return ask(slug, {
      claude: "to draft ad copy and mark the budget and the audience you still choose.",
      chatgpt: "for a checklist of the offer, the caption, and where an ad will run.",
      gemini: "to build a sheet of ad drafts, the caption, and whether you approved the spend.",
      perplexity: "for sourced notes on writing a local ad, with links you can check.",
      deepseek: "to rewrite an ad so it states the offer and does not invent a discount.",
    });
  }
  if (useCaseSlug === "scheduling-assistant" && /\bno-?shows?\b/.test(text)) {
    return ask(slug, {
      claude: "to draft a reminder that cuts down no-shows and a note for anyone who missed.",
      chatgpt: "for a checklist of confirmation texts to send before an appointment.",
      gemini: "to build a sheet of appointments, whether they confirmed, and who did not show.",
      perplexity: "for sourced notes on reducing no-shows, with links you can check.",
      deepseek: "to shorten a reminder so it states the time and how to cancel.",
    });
  }
  if (useCaseSlug === "scheduling-assistant" && /\b(?:project management|task management|task list)\b/.test(text)) {
    return ask(slug, {
      claude: "to turn a project into a task list and mark what you still have to schedule.",
      chatgpt: "for a checklist of project tasks, the owner, and the due date.",
      gemini: "to build a sheet of tasks, the owner, and whether each one is done.",
      perplexity: "for sourced notes on a simple project list, with links you can check.",
      deepseek: "to split a project into the next three tasks you can actually finish.",
    });
  }
  if (useCaseSlug === "hire-candidates" && /\bonboard/.test(text)) {
    return ask(slug, {
      claude: "to draft an onboarding checklist for a new hire and the first note you send them.",
      chatgpt: "for a checklist of paperwork, tools, and the first-week tasks for a new hire.",
      gemini: "to build a sheet of new hires, the start date, and the tasks still open.",
      perplexity: "for sourced notes on a simple onboarding list, with links you can check.",
      deepseek: "to shorten an onboarding note so it states the start time and who to ask.",
    });
  }
  if (useCaseSlug === "customer-support" && /\b(?:faq|chatbots?)\b/.test(text)) {
    return ask(slug, {
      claude: "to draft the questions a website chatbot may answer and which ones a person still takes.",
      chatgpt: "for a checklist of FAQ answers a chatbot can give before a person steps in.",
      gemini: "to build a sheet of frequent questions, the chatbot reply, and when to hand off.",
      perplexity: "for sourced notes on a website FAQ chatbot, with links you can check.",
      deepseek: "to shorten a FAQ answer so a chatbot can say it in one or two sentences.",
    });
  }
  if (useCaseSlug === "customer-support" && phoneQuery(text)) {
    return ask(slug, {
      claude: "to draft what a voice agent should say and which calls a person still takes.",
      chatgpt: "for a checklist of questions the phone greeting should ask.",
      gemini: "to build a sheet of call types, the answer, and when to hand the call to a person.",
      perplexity: "for sourced notes on small-business phone greetings, with links you can check.",
      deepseek: "to draft a short greeting that states the hours and how to reach a person.",
    });
  }
  if (useCaseSlug === "analyze-data" && cashReportQuery(text)) {
    return ask(slug, {
      claude: "to explain a cash-flow spreadsheet and name the total you should recompute.",
      chatgpt: "for a checklist of income, expenses, and the months a cash-flow sheet should show.",
      gemini: "to build a sheet layout for profit and loss, with one tab for the source numbers.",
      perplexity: "for sourced definitions of cash-flow terms, with links you can check.",
      deepseek: "to list which figures in a profit-and-loss table do not support the conclusion.",
    });
  }
  return null;
}

type Forms = { infinitive: string; gerund: string };

export function smallBusinessJobForms(raw: string): Forms | null {
  const text = raw.toLowerCase();
  if (quickBooksQuery(text)) return { infinitive: "clean up QuickBooks", gerund: "cleaning up QuickBooks" };
  if (freshBooksQuery(text)) return { infinitive: "clean up FreshBooks", gerund: "cleaning up FreshBooks" };
  if (xeroQuery(text)) return { infinitive: "clean up Xero", gerund: "cleaning up Xero" };
  if (zohoBooksQuery(text)) return { infinitive: "clean up Zoho books", gerund: "cleaning up Zoho books" };
  if (/\b(my books|the books|messy books|bookkeeping)\b/.test(text)) {
    return { infinitive: "clean up the books", gerund: "cleaning up the books" };
  }
  if (categorizeQuery(text)) return { infinitive: "categorize transactions", gerund: "categorizing transactions" };
  if (reconcileQuery(text)) return { infinitive: "reconcile the bank accounts", gerund: "reconciling the bank accounts" };
  if (payrollQuery(text)) return { infinitive: "run payroll", gerund: "running payroll" };
  if (salesTaxQuery(text)) return { infinitive: "handle sales tax", gerund: "handling sales tax" };
  if (shiftQuery(text)) return { infinitive: "schedule staff shifts", gerund: "scheduling staff shifts" };
  if (newsletterQuery(text)) return { infinitive: "send an email newsletter", gerund: "sending an email newsletter" };
  if (receivableQuery(text) || /^(?:the |your |my )?(?:overdue |unpaid )?invoices?$/.test(text.trim())) {
    return { infinitive: "send the invoices", gerund: "sending the invoices" };
  }
  if (commerceQuery(text)) return { infinitive: "connect the store apps", gerund: "connecting the store apps" };
  if (appointmentQuery(text)) return { infinitive: "book appointments", gerund: "booking appointments" };
  if (/\bgoogle reviews?\b|\breview requests?\b|\breputation\b/.test(text)) {
    return { infinitive: "ask for reviews", gerund: "asking for reviews" };
  }
  if (/\b(quotes?|proposals?)\b/.test(text)) return { infinitive: "write the quote", gerund: "writing the quote" };
  if (/\bcontracts?\b/.test(text)) return { infinitive: "draft a contract", gerund: "drafting a contract" };
  if (/\bsops?\b|standard operating/.test(text)) return { infinitive: "write the SOPs", gerund: "writing the SOPs" };
  if (cashReportQuery(text)) return { infinitive: "read the financial report", gerund: "reading the financial report" };
  if (localSeoQuery(text)) return { infinitive: "draft the local page", gerund: "drafting the local page" };
  if (phoneQuery(text)) return { infinitive: "answer customer calls", gerund: "answering customer calls" };
  if (/\b(hire staff|hire employees|onboard|onboarding)\b/.test(text)) {
    return { infinitive: "hire and onboard staff", gerund: "hiring and onboarding staff" };
  }
  if (/\bdo (?:my |your )?(?:quarterly |estimated )?taxes\b/.test(text)) {
    return { infinitive: "do your quarterly taxes", gerund: "doing your quarterly taxes" };
  }
  if (/\binvoices?\b/.test(text) && !/\b(?:process|purchase|match)\b/.test(text)) {
    return { infinitive: "send the invoices", gerund: "sending the invoices" };
  }
  if (/\bschedul/.test(text) && /\b(salon|staff|team|employees?|shifts?)\b/.test(text)) {
    return { infinitive: "schedule the team", gerund: "scheduling the team" };
  }
  return null;
}

export function smallBusinessCompoundIntro(blob: string): string | null {
  const has = (pattern: RegExp) => pattern.test(blob);
  if (has(/quick\s*books|\bqbo\b/) && has(/invoic/)) {
    return "AI agents can gather the receipts for a QuickBooks cleanup and send the invoices you approve.";
  }
  if (has(/\b(books|bookkeeping)\b/) && has(/invoic/)) {
    return "AI agents can gather the receipts for a books cleanup and send the invoices you approve.";
  }
  if (has(/payroll/) && has(/schedul/)) {
    return "AI agents can draft a payroll checklist from the hours you confirm and propose times for the team.";
  }
  if (has(/newsletter/) && has(/\b(social|instagram|posts?)\b/)) {
    return "AI agents can draft the email newsletter and turn the main point into social posts you can schedule.";
  }
  if (has(/\b(?:quotes?|proposals?)\b/) && has(/\binvoic/)) {
    return "AI agents can draft the quote and send the invoice after you approve the price.";
  }
  if (has(/\b(shopify|etsy|inventory)\b/) && has(/\b(invoice|newsletter)\b/)) {
    return "AI agents can connect the store apps and cover the invoices or the newsletter from the same set of tools.";
  }
  return null;
}

export function smallBusinessRoleBonus(conceptId: string, slug: string, query: string): number {
  if (conceptId === "small-business") {
    const order = ["dext", "bill-com", "mailchimp", "buffer", "zendesk"];
    const index = order.indexOf(slug);
    return index >= 0 ? 500 - index * 40 : 0;
  }
  if (conceptId === "bookkeeping") {
    const order = ["dext", "ramp", "bill-com"];
    const index = order.indexOf(slug);
    return index >= 0 ? 200 - index * 30 : 0;
  }
  if (conceptId === "social" && adsQuery(query) && slug === "predis") return 80;
  if (conceptId === "support" && phoneQuery(query) && slug === "decagon") return 80;
  if (conceptId === "invoices" && receivableQuery(query)) {
    if (slug === "bill-com") return 80;
    if (slug === "dext") return 40;
  }
  if (conceptId === "newsletter") {
    const order = ["klaviyo", "mailchimp"];
    const index = order.indexOf(slug);
    return index >= 0 ? 80 - index * 20 : 0;
  }
  return 0;
}

export type SmokeStatus =
  | "tested-hands-on"
  | "verified-docs-only"
  | "untested";

export type ToolType =
  | "agent"
  | "framework"
  | "copilot"
  | "automation"
  | "model_api"
  | "creative"
  | "infra"
  | "other";

export type PricingModel =
  | "free"
  | "freemium"
  | "subscription"
  | "usage"
  | "open_source"
  | "enterprise"
  | "contact";

export type ToolStatus = "draft" | "published" | "deprecated" | "dead_link";

export type HandsOn = {
  performed: boolean;
  detail?: string;
  package?: string;
  llmCall?: boolean;
  accountSignup?: boolean;
  payment?: boolean;
};

export type Release = {
  repo: string;
  tag: string;
  name: string;
  publishedAt: string;
  url: string;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  affiliateUrl: string | null;
  shortDescription: string;
  longDescription: string;
  categories: string[];
  useCaseTags: string[];
  toolTypes: ToolType[];
  platforms: string[];
  pricingModel: PricingModel[];
  pricingNotes: string | null;
  pricingUrl: string | null;
  /** Lowest paid plan, USD per month. Null when the official page did not show one. */
  startingPrice: number | null;
  /** Trial length as written on the official pricing page, such as "7 days". */
  freeTrial: string | null;
  /** YYYY-MM-DD when the official pricing page was fetched. */
  pricingCheckedAt: string | null;
  docsUrl: string | null;
  freeTier: boolean | null;
  freeTierNotes: string | null;
  openSource: boolean | null;
  repoUrl: string | null;
  bestFor: string[];
  notIdealFor: string[];
  /** One sentence on what the tool is good at, from docs, pricing, or the hands-on note. */
  strength: string;
  /** One sentence on a real limitation, from docs, pricing, or the hands-on note. */
  weakness: string;
  smokeStatus: SmokeStatus;
  smokeTested: boolean;
  checkedAt: string;
  checkedDate: string;
  smokeTestNotes: string | null;
  handsOn: HandsOn;
  latestRelease: Release | null;
  problems: string[];
  featured: boolean;
  featuredPaid: boolean;
  status: ToolStatus;
  publishedAt: string;
  updatedAt: string;
  sources: string[];
  siteLoad: { status: number; finalUrl: string };
  /** One factual sentence per use case this tool can appear for. */
  useCaseFit?: Record<string, string>;
  /** Chat assistant shown only after specialist tools, with a fixed label. */
  generalPurpose?: boolean;
  /** Short name used in a fallback “Ask …” line. */
  assistantName?: string;
  /** draft: research and write. search: look up public sources. */
  assistantKind?: "draft" | "search";
};

export type Recommendation = {
  toolId: string;
  why: string;
};

export type UseCase = {
  slug: string;
  title: string;
  summary: string;
  audienceHints: string[];
  matchTags: string[];
  recommended: Recommendation[];
  /** Plain-language job used in the search header. */
  jobPhrase?: string;
  /** Tasks a chat assistant can be asked to do for this job. */
  assistantTask?: string;
  /** “as you …” ending for that assistant line. */
  assistantContext?: string;
  /** Topic a search assistant can look up for this job. */
  searchTopic?: string;
  /** Shown with this use case. Not a performance claim. */
  disclaimer?: string;
  /** One sentence on how AI agents help with this job. No outcome claim. */
  intro?: string;
};

export type Category = {
  slug: string;
  title: string;
  summary: string;
};

export type SiteMeta = {
  name: string;
  url: string;
  catalogCheckedDate: string;
  newThisWeekSince: string;
  recentReleaseSince: string;
  methodologyVersion: string;
  tagline: string;
};

export type Catalog = {
  site: SiteMeta;
  categories: Category[];
  tools: Tool[];
  useCases: UseCase[];
};

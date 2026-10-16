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

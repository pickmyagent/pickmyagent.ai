import { getSite } from "@/lib/catalog";
import { verifiedOffers } from "@/lib/offers";
import type { Tool } from "@/lib/types";

export function absoluteUrl(path: string): string {
  const base = getSite().url.replace(/\/$/, "");
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function itemListLd(
  name: string,
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function softwareLd(tool: Tool) {
  const sameAs = [tool.repoUrl, tool.docsUrl, tool.pricingUrl].filter(
    (url): url is string => Boolean(url),
  );
  const category =
    tool.toolTypes.includes("creative")
      ? "MultimediaApplication"
      : tool.categories.includes("knowledge")
        ? "BusinessApplication"
        : "DeveloperApplication";
  const offers = verifiedOffers(tool);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.shortDescription,
    url: tool.websiteUrl,
    applicationCategory: category,
    ...(offers ? { offers } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function organizationLd() {
  const site = getSite();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/icon"),
  };
}

export function websiteLd() {
  const site = getSite();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description:
      "Use-case-first directory of AI tools and agents. A short list that fits the job, plus what is new this week.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/tools?q={query}`,
      "query-input": "required name=query",
    },
  };
}

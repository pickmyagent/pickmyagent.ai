import type { Metadata } from "next";

/** Canonical origin for metadataBase, canonical tags, sitemap, and robots. */
export const CANONICAL_ORIGIN = "https://www.pickmyagent.ai";

const TITLE_SUFFIX = " · PickMyAgent";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const socialTitle = title.includes("PickMyAgent")
    ? title
    : `${title}${TITLE_SUFFIX}`;
  return {
    title,
    description,
    alternates: { canonical: `${CANONICAL_ORIGIN}${path}` },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: "PickMyAgent",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}

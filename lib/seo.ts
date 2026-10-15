import type { Metadata } from "next";

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
    alternates: { canonical: path },
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

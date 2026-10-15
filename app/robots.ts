import type { MetadataRoute } from "next";
import { getSite } from "@/lib/catalog";

export default function robots(): MetadataRoute.Robots {
  const site = getSite();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}

import type { MetadataRoute } from "next";
import { getCategories, getSite, getTools, getUseCases } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSite();
  const lastModified = site.catalogCheckedDate;
  const staticPaths = [
    "/",
    "/use-cases",
    "/tools",
    "/new",
    "/how-we-test",
    "/submit",
    "/about",
    "/advertise",
    "/newsletter",
    "/privacy",
    "/terms",
    "/categories",
  ];

  const urls = [
    ...staticPaths,
    ...getUseCases().map((useCase) => `/use-cases/${useCase.slug}`),
    ...getTools()
      .filter((tool) => tool.status === "published")
      .map((tool) => `/tools/${tool.slug}`),
    ...getCategories().map((category) => `/categories/${category.slug}`),
  ];

  return urls.map((path) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/new" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/use-cases/") || path.startsWith("/tools/") ? 0.8 : 0.6,
  }));
}

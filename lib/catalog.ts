import catalogJson from "@/content/catalog.json";
import type { Catalog, Category, Tool, UseCase } from "@/lib/types";

function asCatalog(data: unknown): Catalog {
  if (!data || typeof data !== "object") {
    throw new Error("catalog.json is empty");
  }
  return data as Catalog;
}

const catalog = asCatalog(catalogJson);

export function getSite() {
  return catalog.site;
}

export function getTools(): Tool[] {
  return catalog.tools;
}

export function getTool(slug: string): Tool | undefined {
  return catalog.tools.find((tool) => tool.slug === slug);
}

export function getUseCases(): UseCase[] {
  return catalog.useCases;
}

export function getUseCase(slug: string): UseCase | undefined {
  return catalog.useCases.find((useCase) => useCase.slug === slug);
}

export function getCategories(): Category[] {
  return catalog.categories;
}

export function getCategory(slug: string): Category | undefined {
  return catalog.categories.find((category) => category.slug === slug);
}

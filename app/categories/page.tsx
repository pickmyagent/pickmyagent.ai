import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { getCategories, getTools } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { toolsInCategory } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Categories",
  description:
    "Browse the PickMyAgent catalog by category: agent frameworks, coding agents, game AI, creative media, and more.",
  path: "/categories",
});

export default function CategoriesPage() {
  const categories = getCategories();
  const tools = getTools();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
        ])}
      />
      <JsonLd
        data={itemListLd(
          "Categories",
          categories.map((category) => ({
            name: category.title,
            url: absoluteUrl(`/categories/${category.slug}`),
          })),
        )}
      />
      <PageHeader
        eyebrow="Browse"
        title="Categories"
        lede="Categories group products by kind. Use cases group them by the job. The short list lives on the use-case page."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/categories/${category.slug}`}
              className="block h-full border border-line bg-panel p-4 hover:border-gold"
            >
              <span className="text-lg font-semibold">{category.title}</span>
              <span className="mt-2 block text-sm text-muted">{category.summary}</span>
              <span className="mt-3 block font-mono text-xs text-muted">
                {toolsInCategory(tools, category.slug).length} tools
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

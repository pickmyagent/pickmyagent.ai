import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { ToolCard } from "@/components/tool-card";
import { getCategories, getCategory, getSite, getTools } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { toolsInCategory } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Category not found" };
  return pageMetadata({
    title: category.title,
    description: category.summary,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const site = getSite();
  const tools = toolsInCategory(getTools(), category.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
          { name: category.title, path: `/categories/${category.slug}` },
        ])}
      />
      <JsonLd
        data={itemListLd(
          category.title,
          tools.map((tool) => ({
            name: tool.name,
            url: absoluteUrl(`/tools/${tool.slug}`),
          })),
        )}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/categories", label: "Categories" },
          { label: category.title },
        ]}
      />
      <p className="font-mono text-xs tracking-[0.18em] text-lime uppercase">
        Category
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {category.title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{category.summary}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} recentReleaseSince={site.recentReleaseSince} />
          </li>
        ))}
      </ul>
    </div>
  );
}

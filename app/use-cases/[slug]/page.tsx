import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { RankingNote } from "@/components/ranking-note";
import { ToolCard } from "@/components/tool-card";
import { getSite, getTools, getUseCase, getUseCases } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { groupUseCase } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getUseCases().map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return { title: "Use case not found" };
  return pageMetadata({
    title: useCase.title,
    description: useCase.summary,
    path: `/use-cases/${useCase.slug}`,
  });
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();
  const site = getSite();
  const groups = groupUseCase(getTools(), useCase);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Use cases", path: "/use-cases" },
          { name: useCase.title, path: `/use-cases/${useCase.slug}` },
        ])}
      />
      {groups.recommended.length > 0 ? (
        <JsonLd
          data={itemListLd(
            useCase.title,
            groups.recommended.map(({ tool }) => ({
              name: tool.name,
              url: absoluteUrl(`/tools/${tool.slug}`),
            })),
          )}
        />
      ) : null}
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/use-cases", label: "Use cases" },
          { label: useCase.title },
        ]}
      />
      <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">
        Use case
      </p>
      <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
        {useCase.title}
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{useCase.summary}</p>
      {useCase.related && useCase.related.length > 0 ? (
        <ul className="mt-4 max-w-2xl space-y-1 text-sm">
          {useCase.related.map((item) => (
            <li key={item.slug}>
              <Link href={`/use-cases/${item.slug}`} className="font-semibold text-gold hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Audience">
        {useCase.audienceHints.map((hint) => (
          <li
            key={hint}
            className="border border-line px-2 py-1 font-mono text-xs tracking-wide text-muted uppercase"
          >
            {hint}
          </li>
        ))}
      </ul>
      <p className="mt-6 max-w-2xl text-sm text-muted">
        A short list that fits this job, not a ranking and not a paid order.
        Smoke-tested means we ran a local install or import. Docs checked means
        we read the official site on {site.catalogCheckedDate}.
      </p>

      <RankingNote className="mt-6" />
      {groups.recommended.length > 0 ? (
        <>
          <h2 className="mt-10 text-xl font-semibold">Short list</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {groups.recommended.map(({ tool, why }) => (
              <li key={tool.id}>
                <ToolCard
                  tool={tool}
                  why={why}
                  recentReleaseSince={site.recentReleaseSince}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-10 max-w-2xl text-sm text-muted">
          No specialist in this directory covers this job. Search still explains how AI agents help, and the general assistants cover the how-to.
        </p>
      )}

      {groups.related.length > 0 ? (
        <>
          <h2 className="mt-12 text-xl font-semibold">Also in this use case</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {groups.related.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} recentReleaseSince={site.recentReleaseSince} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {groups.unchecked.length > 0 ? (
        <>
          <h2 className="mt-12 text-xl font-semibold">Not fully checked</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            These names belong to the job, but the October 15, 2026 check could
            not finish verification. They stay visible with a “Not fully
            checked” label. That is not a smoke test and not a docs check.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {groups.unchecked.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} recentReleaseSince={site.recentReleaseSince} />
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-10 text-sm">
        <Link href="/tools" className="font-semibold text-gold hover:underline">
          Filter the full tool index
        </Link>
      </p>
    </div>
  );
}

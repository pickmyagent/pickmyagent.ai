import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ToolBadges } from "@/components/badges";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExternalLink } from "@/components/external-link";
import { JsonLd } from "@/components/json-ld";
import { Prose } from "@/components/prose";
import { ToolCard } from "@/components/tool-card";
import { ToolPricing } from "@/components/tool-pricing";
import { ToolTradeoffs } from "@/components/tool-tradeoffs";
import { getCategories, getSite, getTool, getTools, getUseCases } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { breadcrumbLd, softwareLd } from "@/lib/jsonld";
import {
  platformLabel,
  PRICING_LABELS,
  tagLabel,
  TOOL_TYPE_LABELS,
} from "@/lib/labels";
import { findUseCaseForTag, relatedTools } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return pageMetadata({
    title: tool.name,
    description: tool.shortDescription,
    path: `/tools/${tool.slug}`,
  });
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="border-t border-line py-3">
      <dt className="font-mono text-xs tracking-wide text-muted uppercase">{term}</dt>
      <dd className="mt-1 text-sm leading-relaxed">{children}</dd>
    </div>
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.status !== "published") notFound();

  const site = getSite();
  const tools = getTools();
  const useCases = getUseCases();
  const categories = getCategories();
  const related = relatedTools(tools, tool);

  const statusCopy =
    tool.smokeStatus === "tested-hands-on"
      ? "Smoke-tested means we ran a local install or import in an isolated environment. We did not create an account, pay, or call a model."
      : tool.smokeStatus === "verified-docs-only"
        ? "Docs checked means we opened the official site and the pricing and docs URLs on this page. We did not run a successful local install, so this is not a smoke test."
        : `Not fully checked. The homepage returned HTTP ${tool.siteLoad.status} to our client on ${formatDate(tool.checkedDate)}. That is an environment limit, not proof the site is down in a browser, and it is not a smoke test.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.name, path: `/tools/${tool.slug}` },
        ])}
      />
      <JsonLd data={softwareLd(tool)} />
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/tools", label: "Tools" },
          { label: tool.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article>
          <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">
            Tool
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{tool.name}</h1>
          <div className="mt-5 max-w-xl border border-line bg-panel p-4">
            <ToolPricing tool={tool} />
            <div className="mt-3 border-t border-line pt-3">
              <ToolTradeoffs tool={tool} />
            </div>
          </div>
          <div className="mt-4">
            <ToolBadges tool={tool} recentReleaseSince={site.recentReleaseSince} />
          </div>
          <p className="mt-4 font-mono text-sm text-muted">
            Checked {formatDate(tool.checkedDate)}
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            {tool.shortDescription}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ExternalLink
              href={tool.websiteUrl}
              className="btn-gold inline-flex h-11 items-center px-4 font-semibold"
            >
              Visit website
            </ExternalLink>
            {tool.pricingUrl ? (
              <ExternalLink
                href={tool.pricingUrl}
                className="inline-flex h-11 items-center border border-line px-4 font-semibold hover:border-gold"
              >
                Pricing
              </ExternalLink>
            ) : null}
            {tool.docsUrl ? (
              <ExternalLink
                href={tool.docsUrl}
                className="inline-flex h-11 items-center border border-line px-4 font-semibold hover:border-gold"
              >
                Docs
              </ExternalLink>
            ) : null}
            {tool.repoUrl ? (
              <ExternalLink
                href={tool.repoUrl}
                className="inline-flex h-11 items-center border border-line px-4 font-semibold hover:border-gold"
              >
                Repository
              </ExternalLink>
            ) : null}
          </div>

          <div className="mt-8 max-w-2xl">
            <Prose text={tool.longDescription} />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <section className="border border-line bg-panel p-4">
              <h2 className="font-semibold">Best for</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                {tool.bestFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="border border-line bg-panel p-4">
              <h2 className="font-semibold">Not ideal for</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                {tool.notIdealFor.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">What we checked</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {statusCopy}
            </p>
            {tool.smokeStatus === "tested-hands-on" && tool.handsOn.detail ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed">
                Hands-on: {tool.handsOn.detail}
                {tool.handsOn.package ? ` (${tool.handsOn.package})` : ""}. No
                account, no payment, no model call.
              </p>
            ) : null}
            {tool.smokeTestNotes ? (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {tool.smokeTestNotes}
              </p>
            ) : null}
            {tool.problems.length > 0 ? (
              <div className="mt-4 max-w-2xl border border-amber/40 bg-[#2a2112] p-4">
                <h3 className="font-semibold text-amber">Notes from this check</h3>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm">
                  {tool.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {related.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-xl font-semibold">Related tools</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <ToolCard
                      tool={item}
                      recentReleaseSince={site.recentReleaseSince}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>

        <aside className="h-fit border border-line bg-panel p-4 lg:sticky lg:top-24">
          <h2 className="font-mono text-xs tracking-[0.16em] text-gold uppercase">
            Facts from the check
          </h2>
          <dl className="mt-2">
            <Fact term="Pricing model">
              {tool.pricingModel.length === 0
                ? "Not confirmed on this pass"
                : tool.pricingModel.map((model) => PRICING_LABELS[model]).join(", ")}
            </Fact>
            <Fact term="Open source">
              {tool.openSource === true
                ? "Yes"
                : tool.openSource === false
                  ? "No"
                  : "Not recorded"}
            </Fact>
            <Fact term="Type">
              {tool.toolTypes.map((type) => TOOL_TYPE_LABELS[type]).join(", ")}
            </Fact>
            <Fact term="Platforms">
              {tool.platforms.map(platformLabel).join(", ")}
            </Fact>
            <Fact term="Homepage check">
              HTTP {tool.siteLoad.status}
              {tool.siteLoad.finalUrl ? ` → ${tool.siteLoad.finalUrl}` : ""}
            </Fact>
            {tool.latestRelease ? (
              <Fact term="Latest release we logged">
                <ExternalLink href={tool.latestRelease.url} className="underline">
                  {tool.latestRelease.tag}
                </ExternalLink>
                <span className="mt-1 block text-muted">
                  {formatDate(tool.latestRelease.publishedAt)} UTC
                </span>
              </Fact>
            ) : (
              <Fact term="Latest release we logged">
                No single public GitHub release was used for this check.
              </Fact>
            )}
            <Fact term="Use cases">
              <ul className="space-y-1">
                {tool.useCaseTags.map((tag) => {
                  const useCase = findUseCaseForTag(useCases, tag);
                  return (
                    <li key={tag}>
                      {useCase ? (
                        <Link href={`/use-cases/${useCase.slug}`} className="underline">
                          {tagLabel(tag)}
                        </Link>
                      ) : (
                        tagLabel(tag)
                      )}
                    </li>
                  );
                })}
              </ul>
            </Fact>
            <Fact term="Categories">
              <ul className="space-y-1">
                {tool.categories.map((slug) => {
                  const category = categories.find((item) => item.slug === slug);
                  return (
                    <li key={slug}>
                      <Link href={`/categories/${slug}`} className="underline">
                        {category?.title ?? slug}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Fact>
          </dl>
          {tool.affiliateUrl ? (
            <p className="mt-4 text-xs text-amber">
              Affiliate link. We may earn a commission if you use it.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

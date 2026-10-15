import Link from "next/link";
import { StatusBadge } from "@/components/badges";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { getSite, getTools } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { releasesSince } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "New this week",
  description:
    "Public releases logged during the PickMyAgent catalog check. Not a paid ranking. The weekly email has not shipped yet.",
  path: "/new",
});

export default function NewPage() {
  const site = getSite();
  const tools = getTools();
  const week = releasesSince(tools, site.newThisWeekSince);
  const fortnight = releasesSince(tools, site.recentReleaseSince).filter(
    (tool) => !week.some((item) => item.id === tool.id),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "New this week", path: "/new" },
        ])}
      />
      <JsonLd
        data={itemListLd(
          "New this week",
          week.map((tool) => ({
            name: tool.name,
            url: absoluteUrl(`/tools/${tool.slug}`),
          })),
        )}
      />
      <PageHeader
        eyebrow="Changelog"
        title="New this week"
        lede="Fresh listings and releases we added after a quick check (live site, clear product page). Not a paid ranking."
      />
      <p className="max-w-2xl text-sm leading-relaxed text-muted">
        The whole catalog was seeded on {formatDate(site.catalogCheckedDate)}.
        This page does not badge every seed listing as new. It lists public
        releases we logged with a publish date on or after{" "}
        {formatDate(site.newThisWeekSince)}. The weekly email digest has not
        shipped yet.
      </p>

      {week.length === 0 ? (
        <p className="mt-8 border border-line bg-panel p-4 text-muted">
          We’re seeding the catalog now — subscribe and we’ll email when the
          first weekly digest ships.
        </p>
      ) : (
        <ReleaseList tools={week} />
      )}

      {fortnight.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Also recent</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Releases from {formatDate(site.recentReleaseSince)} through the day
            before this week’s window. Still inside the 14-day “new release”
            badge, not this week’s list.
          </p>
          <ReleaseList tools={fortnight} />
        </section>
      ) : null}

      <p className="mt-10 text-sm">
        <Link href="/newsletter" className="font-semibold text-gold hover:underline">
          Get the weekly digest
        </Link>
        <span className="text-muted"> — the list is not connected yet.</span>
      </p>
    </div>
  );
}

function ReleaseList({
  tools,
}: {
  tools: ReturnType<typeof getTools>;
}) {
  return (
    <ul className="mt-6 divide-y divide-line border border-line bg-panel">
      {tools.map((tool) => (
        <li key={tool.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href={`/tools/${tool.slug}`} className="text-lg font-semibold hover:underline">
              {tool.name}
            </Link>
            <p className="mt-1 text-sm text-muted">{tool.shortDescription}</p>
            {tool.latestRelease ? (
              <p className="mt-2 font-mono text-xs text-muted">
                <a
                  href={tool.latestRelease.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tool.latestRelease.tag}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
                {" · "}
                {formatDate(tool.latestRelease.publishedAt)} UTC
              </p>
            ) : null}
          </div>
          <StatusBadge status={tool.smokeStatus} />
        </li>
      ))}
    </ul>
  );
}

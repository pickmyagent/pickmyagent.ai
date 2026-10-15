import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { ToolBrowser } from "@/components/tool-browser";
import { getSite, getTools, getUseCases } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { publishedTools, sortByEvidence } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI tools",
  description:
    "Every AI tool and agent in the PickMyAgent catalog, with check status, date, and filters for use case, type, and pricing.",
  path: "/tools",
});

export default function ToolsPage() {
  const site = getSite();
  const tools = sortByEvidence(publishedTools(getTools()));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
        ])}
      />
      <JsonLd
        data={itemListLd(
          "PickMyAgent tools",
          tools.map((tool) => ({
            name: tool.name,
            url: absoluteUrl(`/tools/${tool.slug}`),
          })),
        )}
      />
      <PageHeader
        eyebrow="Catalog"
        title="Tools"
        lede="Filter by the job, the kind of product, and how far we actually checked it. Checked dates are from the catalog pass, not a user review."
      />
      <Suspense fallback={<p className="text-muted">Loading filters…</p>}>
        <ToolBrowser
          tools={tools}
          useCases={getUseCases()}
          recentReleaseSince={site.recentReleaseSince}
        />
      </Suspense>
    </div>
  );
}

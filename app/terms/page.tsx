import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description:
    "PickMyAgent is an informational directory. Listings are not endorsements, rankings, or offers to sell featured placement.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Terms", path: "/terms" },
        ])}
      />
      <PageHeader
        eyebrow="Terms"
        title="Terms"
        lede="The directory is information from a dated check. Confirm anything important on the official site before you buy, install, or depend on it."
      />
      <div className="space-y-4 leading-relaxed text-muted">
        <p>
          Listings are not endorsements, partnerships, or a guarantee that a
          product will fit your job. “Best for” and “Not ideal for” are short
          editorial notes, not scores.
        </p>
        <p>
          Prices, free tiers, and release versions change. The tool page says
          when we checked. If a figure appears, it came from that check and can
          go stale.
        </p>
        <p>
          A smoke-tested badge means a local install or import on the date
          shown. It does not mean we completed a full product review. Docs
          checked means we read public pages and did not run that install.
        </p>
        <p>
          There is no paid placement in the current catalog. If we add featured
          slots later, paid ones will be labeled Featured (paid) and will stay
          separate from testing. Affiliate links, if added later, will be
          disclosed.
        </p>
        <p>
          The site is provided as-is, without a warranty that every link will
          resolve or that a listing is complete.
        </p>
      </div>
    </div>
  );
}

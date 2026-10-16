import { NewsletterSignup } from "@/components/newsletter-signup";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { getNewsletterFormUrl } from "@/lib/newsletter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Weekly digest",
  description:
    "One short email: new PickMyAgent listings and notable releases. No hype filler, and no subscriber count until it is real.",
  path: "/newsletter",
});

export default function NewsletterPage() {
  const newsletterUrl = getNewsletterFormUrl();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Newsletter", path: "/newsletter" },
        ])}
      />
      <PageHeader
        eyebrow="Digest"
        title="Weekly new agents & tools"
        lede="One short email: new listings, notable releases, no hype filler. The first digest ships when there is a week of real additions to send."
      />
      {newsletterUrl ? (
        <NewsletterSignup idPrefix="newsletter-page" className="mt-8" />
      ) : (
        <p className="mt-8 text-muted">
          The weekly email is not open for signups yet.
        </p>
      )}
    </div>
  );
}

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description:
    "What PickMyAgent does with the newsletter form, tool submissions, and pages you visit. No accounts in this version.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ])}
      />
      <PageHeader
        eyebrow="Privacy"
        title="Privacy"
        lede="This version of the site does not have accounts, and it does not store newsletter signups or tool submissions on our servers."
      />
      <div className="space-y-4 leading-relaxed text-muted">
        <p>
          The newsletter form is a placeholder until Beehiiv or Buttondown is
          connected. Until then, the email you type is not sent anywhere and is
          not saved. When a provider is connected, that provider’s own privacy
          policy applies to the address you submit, and the form will say which
          provider it uses.
        </p>
        <p>
          The submit-a-tool form does not write to a database. If a public
          inbox is configured, the form opens your email app. Otherwise it
          copies the text to your clipboard. Do not include secrets in a
          submission.
        </p>
        <p>
          Tool pages link to official sites. Those sites have their own
          tracking and policies. This version of PickMyAgent does not embed
          analytics.
        </p>
        <p>
          The catalog itself is public information we checked: product names,
          official URLs, and notes from that check.
        </p>
      </div>
    </div>
  );
}

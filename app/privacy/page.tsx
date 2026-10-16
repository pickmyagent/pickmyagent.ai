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
          The newsletter form is shown only when the list is connected. Until
          then there is no email field on the site. When it is connected,
          submitting the form sends your address to that provider, and that
          provider’s privacy policy applies. PickMyAgent does not store the
          address.
        </p>
        <p>
          When the community board is connected, sign-in goes through Supabase
          with Google or Discord, and the threads and replies you post are
          stored there. Until the board is connected, the site has no accounts.
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

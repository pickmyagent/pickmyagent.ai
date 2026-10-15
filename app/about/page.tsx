import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "PickMyAgent is an independent, use-case-first directory of AI tools and agents. No invented stats, testimonials, or rankings.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHeader
        eyebrow="About"
        title="What PickMyAgent is"
        lede="Tell us the job and we’ll recommend the few AI tools that actually fit, plus show you what’s new this week."
      />
      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          PickMyAgent is a directory for people into AI, agents, tech, and
          gaming. Pages start from a job — build a crew, code with an agent,
          give that agent a browser, make game art, take meeting notes — and
          show a short list.
        </p>
        <p>
          It is independent. Listings are editorial. We do not publish star
          ratings, testimonials, user counts, or “trusted by” lines. A
          smoke-tested badge is only for a hands-on check, and the date of that
          check is on the tool page.
        </p>
        <p>
          The catalog lives in this repository as JSON. There is no database
          and no account system in this version. Submitting a tool does not
          publish it, and there is no payment flow yet.
        </p>
        <p>
          PickMyAgent is an independent directory. We may use affiliate links
          later; if we do, we’ll disclose them. Paid placements will be marked.
        </p>
      </div>
    </div>
  );
}

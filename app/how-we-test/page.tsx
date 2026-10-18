import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { getSite, getTools } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { breadcrumbLd } from "@/lib/jsonld";
import { countByStatus } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How we test",
  description:
    "PickMyAgent only marks a tool Smoke-tested after a local install or import. Docs checked and not-fully-checked listings are labeled separately.",
  path: "/how-we-test",
});

export default function HowWeTestPage() {
  const site = getSite();
  const counts = countByStatus(getTools());
  const checked = formatDate(site.catalogCheckedDate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "How we test", path: "/how-we-test" },
        ])}
      />
      <PageHeader
        eyebrow={`Methodology ${site.methodologyVersion}`}
        title="How we test"
        lede="We don’t claim to have reviewed every AI tool on earth. A badge is a record of a specific check, with a date."
      />

      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          The catalog check behind this version of the site ran on {checked}.
          Counts below are how that pass came out. They are not user totals,
          ratings, or a quality ranking.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Tools checked", counts.total],
          ["Smoke-tested", counts.handsOn],
          ["Docs checked", counts.docs],
          ["Not fully checked", counts.untested],
        ].map(([label, value]) => (
          <div key={label} className="border border-line bg-panel p-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-2xl text-gold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-muted">
        Free tier on that pass: {counts.freeYes} yes, {counts.freeNo} no,{" "}
        {counts.freeUnconfirmed} unconfirmed. Unconfirmed stays unconfirmed.
      </p>

      <section className="mt-10 space-y-4 leading-relaxed">
        <h2 className="text-xl font-semibold">What the labels mean</h2>
        <h3 className="pt-2 font-semibold text-gold">Smoke-tested</h3>
        <p className="text-muted">
          We ran a real local install or an equivalent hello-path in this
          environment, such as <code className="font-mono text-text">pip install</code>{" "}
          plus an import or a CLI help command. No paid plan, no account
          signup, and no model or API call unless a free local path exists
          without keys. The tool page names the package version and the command.
        </p>
        <h3 className="pt-2 font-semibold text-ice">Docs checked</h3>
        <p className="text-muted">
          The official site and/or docs and pricing pages were fetched well
          enough to record the URL status, pricing or free-tier notes, and a
          public release date when one existed. There was no successful local
          hello-world. This label is visible on purpose so it cannot be mistaken
          for a hands-on test.
        </p>
        <h3 className="pt-2 font-semibold text-amber">Not fully checked</h3>
        <p className="text-muted">
          We could not finish docs and pricing verification. A homepage blocked
          with HTTP 403 is the usual reason. Those tools stay in the catalog
          with that label. They are not placed on a use-case short list.
        </p>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed">
        <h2 className="text-xl font-semibold">Checklist</h2>
        <ol className="list-decimal space-y-3 pl-5 text-muted">
          <li>
            Site loads. HTTP GET the canonical homepage and follow redirects.
            Record the status. A 403 from bot protection is not proof the site
            is dead.
          </li>
          <li>
            Pricing and free tier. Prefer the official pricing page. Record
            whether a free tier, free plan, or community self-host edition is
            explicit. If it is unclear, mark it unconfirmed. Never invent a
            price.
          </li>
          <li>
            Docs. Confirm a docs URL responds, or use the GitHub README for an
            open-source project.
          </li>
          <li>
            Latest release. For GitHub-backed open source, use the GitHub
            Releases API. For closed products, say when no single public release
            feed was used.
          </li>
          <li>
            Hands-on, where a local install is feasible. Install in an isolated
            environment and import or run help. Do not create accounts or pay.
            Do not claim a model run without keys.
          </li>
        </ol>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-muted">
        <h2 className="text-xl font-semibold text-text">What we did not do</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>We did not sign up for any product or enter payment details.</li>
          <li>Hands-on Python installs did not invoke models. No API keys were used.</li>
          <li>
            <code className="font-mono text-text">npm install n8n</code> was
            attempted and failed in this environment. That failure is on the n8n
            page, and the badge stays Docs checked.
          </li>
          <li>
            HTTP 403 to our crawler is an environment limit, not proof a
            browser fails.
          </li>
          <li>We do not sell the smoke-tested badge.</li>
          <li>
            Any sponsored or featured placement is labeled Sponsored and is
            separate from testing. No tool can pay to change its ranking.
          </li>
          <li>There are no star ratings, testimonials, or user counts on this site.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3 leading-relaxed text-muted">
        <h2 className="text-xl font-semibold text-text">New this week</h2>
        <p>
          “New release” means a public release timestamp on or after{" "}
          {formatDate(site.recentReleaseSince)}, relative to the {checked} check.
          “New this week” on the homepage is the tighter window starting{" "}
          {formatDate(site.newThisWeekSince)}. The directory itself was seeded
          on {checked}, so we do not mark every listing New just because the
          site is new.
        </p>
        <p>
          <Link href="/new" className="font-semibold text-gold hover:underline">
            See the current list
          </Link>
          . The same rules are summarized for agents in{" "}
          <Link href="/llms.txt" className="underline">
            llms.txt
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

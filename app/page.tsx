import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { JobSearch } from "@/components/job-search";
import { JsonLd } from "@/components/json-ld";
import { StatusBadge } from "@/components/badges";
import { getCategories, getSite, getTools, getUseCases } from "@/lib/catalog";
import { formatDate } from "@/lib/format";
import { absoluteUrl, itemListLd, organizationLd, websiteLd } from "@/lib/jsonld";
import { getNewsletterFormUrl } from "@/lib/newsletter";
import { releasesSince } from "@/lib/query";

const STEPS = [
  "Open the official site and confirm it resolves.",
  "Read what the product claims to do (pricing page if public).",
  "Note fit: best for / not ideal for, in plain language.",
  "Record a last checked date.",
];

export default function HomePage() {
  const site = getSite();
  const tools = getTools();
  const useCases = getUseCases();
  const categories = getCategories();
  const newsletterUrl = getNewsletterFormUrl();
  const fresh = releasesSince(tools, site.newThisWeekSince);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <JsonLd data={organizationLd()} />
      <JsonLd data={websiteLd()} />
      <JsonLd
        data={itemListLd(
          "PickMyAgent use cases",
          useCases.map((useCase) => ({
            name: useCase.title,
            url: absoluteUrl(`/use-cases/${useCase.slug}`),
          })),
        )}
      />

      <section className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">
          AI tools, sorted by the job
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Find the AI tool that fits the job.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          PickMyAgent is an Agentic Tool directory where you can discover and
          find what AI tool is best suited to handle your use case. Tell us
          what you’re trying to do with AI, whether that’s creating clips for
          YouTube videos, automating personal tasks, or even generating your
          own short film. PickMyAgent searches, gathers, and organizes the
          tools that can do the job, then helps you find the right AI tool and
          compare costs.
        </p>
      </section>

      <div className="mt-8">
        <JobSearch useCases={useCases} tools={tools} categories={categories} />
      </div>

      <section id="new" className="mt-16 scroll-mt-24">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">New this week</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Fresh listings and releases we added after a quick check (live
              site, clear product page). Not a paid ranking.
            </p>
          </div>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/new" className="text-gold hover:underline">
              See all new
            </Link>
            <Link href="/newsletter" className="text-text hover:underline">
              Get the weekly digest
            </Link>
          </div>
        </div>
        {fresh.length === 0 ? (
          <p className="mt-6 border border-line bg-panel p-4 text-muted">
            We’re seeding the catalog now — subscribe and we’ll email when the
            first weekly digest ships.
          </p>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-muted">
              Public releases dated {formatDate(site.newThisWeekSince)} or later,
              logged during the {formatDate(site.catalogCheckedDate)} catalog
              check. The weekly email has not shipped yet.
            </p>
            <ul className="mt-4 divide-y divide-line border border-line bg-panel">
              {fresh.map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="flex flex-col gap-2 px-4 py-3 hover:bg-panel-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="font-semibold">{tool.name}</span>
                      <span className="mt-1 block font-mono text-xs text-muted">
                        {tool.latestRelease?.tag} ·{" "}
                        {formatDate(tool.latestRelease?.publishedAt ?? tool.checkedDate)}
                      </span>
                    </span>
                    <StatusBadge status={tool.smokeStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section id="how-we-test" className="mt-16 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight">How we test</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted">
          We don’t claim to have “reviewed every AI tool on earth.” For listings
          we mark <strong className="font-semibold text-text">Smoke-tested</strong>,
          we:
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li key={step} className="border border-line bg-panel p-4">
              <span className="font-mono text-xs text-gold">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-2">{step}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-muted">
          We do not sell the smoke-tested badge. Paid “Featured” placement (when
          offered) is labeled as paid and is separate from testing.
        </p>
        <Link
          href="/how-we-test"
          className="mt-4 inline-flex font-semibold text-gold hover:underline"
        >
          Read the full methodology
        </Link>
      </section>

      <section
        className={`mt-16 grid gap-4 ${newsletterUrl ? "lg:grid-cols-2" : ""}`}
      >
        {newsletterUrl ? (
          <div id="newsletter" className="scroll-mt-24 border border-line bg-panel p-5">
            <NewsletterSignup idPrefix="home-newsletter" />
          </div>
        ) : null}
        <div id="submit" className="scroll-mt-24 border border-line bg-panel p-5">
          <h2 className="text-2xl font-semibold tracking-tight">
            List your AI or agent tool
          </h2>
          <p className="mt-2 text-muted">
            Free editorial review while we grow the catalog. Fast-track and
            featured options are coming soon.
          </p>
          <Link
            href="/submit"
            className="btn-gold mt-5 inline-flex h-12 items-center px-5 font-semibold"
          >
            Submit a tool
          </Link>
        </div>
      </section>
    </div>
  );
}

import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description:
    "PickMyAgent takes the search off your plate and shows a short list of AI tools that can do the job, with pricing from the official page.",
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
      <PageHeader eyebrow="About" title="About PickMyAgent" />
      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          There are thousands of AI tools, and new ones launch every week.
          Finding the right one usually means hours of searching, sorting
          through hype, and sometimes finding out the hard way that the new
          tool you just paid for can’t do the job, or worse, just sucks at it!
        </p>
        <p>
          PickMyAgent takes that off your plate. Tell us in our search bar what
          you want to get done with AI, maybe turning your gaming streams into
          highlight reels, automating everyday tasks, or making a short film,
          and PickMyAgent will show you a short list of tools that can actually
          do the job.
        </p>
        <p>
          For every tool, we tell you what it’s good at, what it costs, and
          whether there’s a free plan or trial, with a link to the official
          pricing so you’re never surprised. No more wasted money on agents or
          AI tools that don’t do what you need them to.
        </p>
        <p>
          No hype, no hour-long rabbit holes, no wasted subscriptions. Just the
          right AI tool for the job, so you can get back to creating.
        </p>
      </div>
    </div>
  );
}

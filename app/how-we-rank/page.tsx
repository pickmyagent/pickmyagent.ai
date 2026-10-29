import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How we rank tools",
  description:
    "No tool can pay to change its ranking, position, or strength and weakness notes. Affiliate commissions never change which tool PickMyAgent recommends.",
  path: "/how-we-rank",
});

export default function HowWeRankPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "How we rank tools", path: "/how-we-rank" },
        ])}
      />
      <PageHeader
        eyebrow="Rankings"
        title="How we rank tools"
        lede="PickMyAgent is objective. A tool cannot buy a higher place, a different position, or a kinder strength or weakness."
      />
      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          No tool can pay to change its ranking, its position on a list, or the
          strength and weakness bullets we write. Any sponsored or featured
          placement is always clearly labeled{" "}
          <strong className="font-semibold text-text">Sponsored</strong>. That
          label is separate from the editorial list.
        </p>
        <p>
          Some links on PickMyAgent may be affiliate links. If you sign up
          through one, we may earn a commission at no extra cost to you.
          Commissions never affect rankings or which tool we recommend.
        </p>
        <p>
          We match your search to the concrete jobs each tool lists. When the
          wording fits a job we already publish, that job supplies the header.
          When it does not, the closest specialist tools still show, and each
          why-line names the job that matched. A general chat assistant is
          labeled, and it is marked as a fallback when fewer than three
          specialists fit. For each tool we show a
          starting cost when we could verify one, the date we checked it, and a
          link to the official pricing page. Every listing has one strength and
          one weakness. Tools we have tested hands-on are labeled Smoke-tested.
          The others are reviewed from official docs and pricing: Docs checked
          when that review finished, and Not fully checked when it did not. We
          do not claim every tool is tested.
        </p>
        <p>
          Questions or corrections:{" "}
          <a
            href="mailto:advertise@pickmyagent.ai"
            className="text-gold hover:underline"
          >
            advertise@pickmyagent.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}

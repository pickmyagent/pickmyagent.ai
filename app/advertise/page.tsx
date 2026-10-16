import { AdvertiseForm } from "@/components/advertise-form";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { breadcrumbLd } from "@/lib/jsonld";
import { pageMetadata } from "@/lib/seo";

const OPTIONS = [
  {
    title: "Featured listing",
    detail: "A marked placement on a tool’s category or use-case page.",
  },
  {
    title: "Homepage spotlight",
    detail: "A marked slot on the homepage, separate from the editorial short list.",
  },
  {
    title: "Newsletter sponsorship",
    detail: "A marked mention in the catalog newsletter.",
  },
];

export const metadata = pageMetadata({
  title: "Advertise",
  description:
    "Sponsor a PickMyAgent placement. The audience is people into AI, agents, tech, and gaming. This page does not take payment.",
  path: "/advertise",
});

export default function AdvertisePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Advertise", path: "/advertise" },
        ])}
      />
      <PageHeader
        eyebrow="Sponsors"
        title="Advertise with us"
        lede="PickMyAgent is read by people into AI, agents, tech, and gaming. They come here to find a tool for a job, not to scroll a wall of logos."
      />
      <div className="space-y-4 text-base leading-relaxed text-muted">
        <p>
          Sponsorships are marked when they run. They do not change smoke-test
          badges, check dates, or which tools the editorial short list
          recommends.
        </p>
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Options</h2>
        <ul className="mt-4 grid gap-3">
          {OPTIONS.map((option) => (
            <li key={option.title} className="border border-line bg-panel p-4">
              <p className="font-semibold">{option.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{option.detail}</p>
              <p className="mt-3 font-mono text-xs tracking-[0.14em] text-gold uppercase">
                Coming soon
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Tell us you’re interested</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Send a note. Nothing is charged, and the form does not store what you
          type.
        </p>
        <div className="mt-4">
          <AdvertiseForm />
        </div>
      </section>
    </div>
  );
}

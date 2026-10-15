import { PageHeader } from "@/components/page-header";
import { SubmitForm } from "@/components/submit-form";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbLd } from "@/lib/jsonld";
import { getSubmitEmail } from "@/lib/newsletter";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Submit a tool",
  description:
    "Submit an AI or agent tool for editorial review. Nothing is auto-published, and there is no payment on this form.",
  path: "/submit",
});

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Submit a tool", path: "/submit" },
        ])}
      />
      <PageHeader
        eyebrow="Catalog"
        title="List your AI or agent tool"
        lede="Free editorial review while we grow the catalog. Fast-track and featured options come later. Prices are not set, so this page does not invent them."
      />
      <SubmitForm submitEmail={getSubmitEmail()} />
    </div>
  );
}

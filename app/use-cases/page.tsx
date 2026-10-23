import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";
import { getTools, getUseCases } from "@/lib/catalog";
import { absoluteUrl, breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { groupUseCase } from "@/lib/query";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Use cases",
  description:
    "Browse AI tools by the job: multi-agent workflows, coding agents, game NPCs, creative tools, and more.",
  path: "/use-cases",
});

export default function UseCasesPage() {
  const tools = getTools();
  const useCases = getUseCases();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Use cases", path: "/use-cases" },
        ])}
      />
      <JsonLd
        data={itemListLd(
          "Use cases",
          useCases.map((useCase) => ({
            name: useCase.title,
            url: absoluteUrl(`/use-cases/${useCase.slug}`),
          })),
        )}
      />
      <PageHeader
        eyebrow="Jobs"
        title="Use cases"
        lede="Start from the job, not a wall of logos. Each page is a short list, not a ranking."
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {useCases.map((useCase, index) => {
          const groups = groupUseCase(tools, useCase);
          const count =
            groups.recommended.length + groups.related.length + groups.unchecked.length;
          return (
            <li key={useCase.slug}>
              <Link
                href={`/use-cases/${useCase.slug}`}
                className="flex h-full flex-col border border-line bg-panel p-4 hover:border-gold"
              >
                <span className="font-mono text-xs text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-2 text-lg font-semibold">{useCase.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted">
                  {useCase.summary}
                </span>
                <span className="mt-4 font-mono text-xs text-muted">
                  {count === 0
                    ? "No specialist in the directory"
                    : `${count} tools · ${groups.recommended.length} on the short list`}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

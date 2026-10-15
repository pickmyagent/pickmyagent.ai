import { getSite, getTools, getUseCases } from "@/lib/catalog";
import { smokeLabel } from "@/lib/labels";
import { groupUseCase } from "@/lib/query";

export function GET() {
  const site = getSite();
  const tools = getTools().filter((tool) => tool.status === "published");
  const useCases = getUseCases();
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> Use-case-first directory of AI tools and agents. Tell us the job and we point to a short list that fits. Smoke-tested means a local install or import on the date shown. Docs checked is not a hands-on test. Not fully checked means verification did not finish.`,
    "",
    `Catalog checked: ${site.catalogCheckedDate}`,
    `Methodology: ${site.methodologyVersion}`,
    "",
    "## Use cases",
    "",
  ];

  for (const useCase of useCases) {
    const groups = groupUseCase(tools, useCase);
    const names = groups.recommended.map((item) => item.tool.name).join(", ");
    lines.push(
      `- [${useCase.title}](${site.url}/use-cases/${useCase.slug}): ${useCase.summary} Short list: ${names}.`,
    );
  }

  lines.push("", "## Tools", "");
  for (const tool of tools) {
    lines.push(
      `- [${tool.name}](${site.url}/tools/${tool.slug}): ${tool.shortDescription} Status: ${smokeLabel(tool.smokeStatus)}. Checked: ${tool.checkedDate}. Website: ${tool.websiteUrl}`,
    );
  }

  lines.push(
    "",
    "## Also",
    "",
    `- [How we test](${site.url}/how-we-test)`,
    `- [New this week](${site.url}/new)`,
    `- [Submit a tool](${site.url}/submit): editorial review only. Nothing is auto-published. No payments.`,
    "",
  );

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

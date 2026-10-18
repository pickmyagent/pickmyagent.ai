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
    `> ${site.name} (${site.url}) is a use-case-first directory of AI tools and agents. Search for the job you want done and the site returns a short list of tools that can do it, with what each one is good at, a real limitation, and pricing taken from the official page. Prices that were not verified are left blank. Smoke-tested means a local install or import on the date shown. Docs checked is not a hands-on test. Not fully checked means verification did not finish.`,
    "",
    `Catalog checked: ${site.catalogCheckedDate}`,
    `Methodology: ${site.methodologyVersion}`,
    "",
    "## Pages",
    "",
    `- [Home](${site.url}/)`,
    `- [Tools](${site.url}/tools)`,
    `- [Use cases](${site.url}/use-cases)`,
    `- [Categories](${site.url}/categories)`,
    `- [How we test](${site.url}/how-we-test)`,
    `- [How we rank tools](${site.url}/how-we-rank)`,
    `- [About](${site.url}/about)`,
    `- [Community](${site.url}/community)`,
    `- [New this week](${site.url}/new)`,
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
    `- [Submit a tool](${site.url}/submit): editorial review only. Nothing is auto-published. No payments.`,
    "",
  );

  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

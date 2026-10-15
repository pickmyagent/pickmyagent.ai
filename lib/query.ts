import type { Tool, UseCase } from "@/lib/types";

const EVIDENCE_ORDER: Record<Tool["smokeStatus"], number> = {
  "tested-hands-on": 0,
  "verified-docs-only": 1,
  untested: 2,
};

export function publishedTools(tools: Tool[]): Tool[] {
  return tools.filter((tool) => tool.status === "published");
}

export function sortByEvidence(tools: Tool[]): Tool[] {
  return [...tools].sort((a, b) => {
    const evidence = EVIDENCE_ORDER[a.smokeStatus] - EVIDENCE_ORDER[b.smokeStatus];
    if (evidence !== 0) return evidence;
    return a.name.localeCompare(b.name);
  });
}

export function isRecentRelease(tool: Tool, since: string): boolean {
  const published = tool.latestRelease?.publishedAt;
  if (!published) return false;
  return published.slice(0, 10) >= since;
}

export function releasesSince(tools: Tool[], since: string): Tool[] {
  return publishedTools(tools)
    .filter((tool) => isRecentRelease(tool, since))
    .sort((a, b) =>
      (b.latestRelease?.publishedAt ?? "").localeCompare(
        a.latestRelease?.publishedAt ?? "",
      ),
    );
}

export type UseCaseGroups = {
  recommended: { tool: Tool; why: string }[];
  related: Tool[];
  unchecked: Tool[];
};

export function groupUseCase(tools: Tool[], useCase: UseCase): UseCaseGroups {
  const matching = publishedTools(tools).filter((tool) =>
    tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag)),
  );
  const recommended = useCase.recommended.map((recommendation) => {
    const tool = tools.find((item) => item.id === recommendation.toolId);
    if (!tool) {
      throw new Error(
        `Use case ${useCase.slug} recommends missing tool ${recommendation.toolId}`,
      );
    }
    return { tool, why: recommendation.why };
  });
  const recommendedIds = new Set(useCase.recommended.map((item) => item.toolId));
  const rest = matching.filter((tool) => !recommendedIds.has(tool.id));
  return {
    recommended,
    related: sortByEvidence(rest.filter((tool) => tool.smokeStatus !== "untested")),
    unchecked: rest.filter((tool) => tool.smokeStatus === "untested"),
  };
}

export function toolsInCategory(tools: Tool[], categorySlug: string): Tool[] {
  return sortByEvidence(
    publishedTools(tools).filter((tool) => tool.categories.includes(categorySlug)),
  );
}

export function relatedTools(tools: Tool[], tool: Tool, limit = 4): Tool[] {
  const tags = new Set(tool.useCaseTags);
  return sortByEvidence(
    publishedTools(tools).filter(
      (item) =>
        item.id !== tool.id && item.useCaseTags.some((tag) => tags.has(tag)),
    ),
  ).slice(0, limit);
}

export function countByStatus(tools: Tool[]) {
  return {
    total: tools.length,
    handsOn: tools.filter((tool) => tool.smokeStatus === "tested-hands-on").length,
    docs: tools.filter((tool) => tool.smokeStatus === "verified-docs-only").length,
    untested: tools.filter((tool) => tool.smokeStatus === "untested").length,
    freeYes: tools.filter((tool) => tool.freeTier === true).length,
    freeNo: tools.filter((tool) => tool.freeTier === false).length,
    freeUnconfirmed: tools.filter((tool) => tool.freeTier === null).length,
  };
}

export function findUseCaseForTag(useCases: UseCase[], tag: string): UseCase | undefined {
  return useCases.find((useCase) => useCase.matchTags.includes(tag));
}

export function toolHaystack(tool: Tool): string {
  return [
    tool.name,
    tool.shortDescription,
    tool.longDescription,
    ...tool.bestFor,
    ...tool.useCaseTags,
    ...tool.toolTypes,
    ...tool.platforms,
    ...tool.categories,
  ].join(" ");
}

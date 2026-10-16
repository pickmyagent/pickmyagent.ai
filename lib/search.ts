import type { Category, SmokeStatus, Tool, UseCase } from "./types";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "my",
  "your",
  "our",
  "from",
  "of",
  "in",
  "on",
  "with",
  "and",
  "or",
  "to",
  "for",
  "into",
  "that",
  "this",
  "it",
  "is",
  "are",
  "be",
  "do",
  "me",
  "i",
  "we",
  "you",
  "what",
  "how",
  "please",
  "some",
  "any",
  "just",
  "can",
  "via",
  "by",
  "at",
  "as",
  "if",
  "so",
  "than",
  "then",
  "but",
  "about",
  "trying",
  "using",
  "want",
  "need",
  "im",
  "its",
  "create",
  "make",
]);

const SYNONYM_GROUPS = [
  ["twitch", "stream", "streams", "streamer", "streamers", "streaming", "vod", "livestream", "kick"],
  ["highlight", "highlights", "clip", "clips", "clipping", "reel", "reels", "shorts", "short"],
  ["video", "videos", "youtube", "film", "movie", "movies", "cinematic"],
  ["email", "inbox", "gmail", "mail"],
  ["automate", "automation", "automated", "automating", "workflow", "workflows"],
];

const SYNONYMS = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const set = new Set(group);
  for (const word of group) SYNONYMS.set(word, set);
}

const CLIP_TERMS = SYNONYMS.get("clip") ?? new Set<string>();

export type RankedTool = {
  slug: string;
  name: string;
  shortDescription: string;
  smokeStatus: SmokeStatus;
  checkedDate: string;
  score: number;
};

export type RankedUseCase = {
  slug: string;
  title: string;
  summary: string;
  toolCount: number;
  smokeTestedCount: number;
  score: number;
};

export type RankedSearch = {
  tools: RankedTool[];
  useCases: RankedUseCase[];
  fallback: boolean;
};

type IndexedTool = RankedTool & {
  categories: string[];
  useCaseTags: string[];
  tokens: Set<string>;
  nameTokens: Set<string>;
  text: string;
  tags: string;
  tagTokens: Set<string>;
};

type IndexedUseCase = RankedUseCase & {
  matchTags: string[];
  tokens: Set<string>;
  text: string;
};

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function queryTokens(query: string): string[] {
  return words(query).filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function hitsClipTerms(text: string, tokens: Set<string>): boolean {
  if ([...tokens].some((token) => CLIP_TERMS.has(token))) return true;
  const lower = text.toLowerCase();
  for (const word of CLIP_TERMS) {
    if (word.length >= 4 && lower.includes(word)) return true;
  }
  return false;
}

function points(text: string, tokens: Set<string>, terms: string[], exact: number, synonym: number): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (tokens.has(term) || lower.includes(term)) {
      score += exact;
      continue;
    }
    const group = SYNONYMS.get(term);
    if (group && [...tokens].some((token) => group.has(token))) score += synonym;
  }
  return score;
}

function toolText(tool: Tool): string {
  return [
    tool.shortDescription,
    tool.longDescription,
    ...tool.bestFor,
  ].join(" ");
}

function tagText(tool: Tool): string {
  return [...tool.useCaseTags, ...tool.toolTypes, ...tool.platforms, ...tool.categories].join(" ");
}

export function textMatchesQuery(query: string, text: string): boolean {
  const terms = queryTokens(query);
  if (!query.trim() || terms.length === 0) return true;
  const tokens = new Set(words(text));
  return points(text, tokens, terms, 1, 1) > 0;
}

export function rankCatalogQuery(
  query: string,
  catalog: { tools: Tool[]; useCases: UseCase[]; categories: Category[] },
): RankedSearch {
  const published = catalog.tools.filter((tool) => tool.status === "published");
  const indexedTools: IndexedTool[] = published.map((tool) => {
    const text = toolText(tool);
    const tags = tagText(tool);
    return {
      slug: tool.slug,
      name: tool.name,
      shortDescription: tool.shortDescription,
      smokeStatus: tool.smokeStatus,
      checkedDate: tool.checkedDate,
      score: 0,
      categories: tool.categories,
      useCaseTags: tool.useCaseTags,
      tokens: new Set(words(text)),
      nameTokens: new Set(words(tool.name)),
      text,
      tags,
      tagTokens: new Set(words(tags)),
    };
  });

  const indexedCases: IndexedUseCase[] = catalog.useCases.map((useCase) => {
    const tagged = indexedTools.filter((tool) =>
      tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag)),
    );
    const text = [
      useCase.title,
      useCase.summary,
      ...useCase.audienceHints,
      ...useCase.matchTags,
    ].join(" ");
    return {
      slug: useCase.slug,
      title: useCase.title,
      summary: useCase.summary,
      toolCount: tagged.length,
      smokeTestedCount: tagged.filter((tool) => tool.smokeStatus === "tested-hands-on").length,
      score: 0,
      matchTags: useCase.matchTags,
      tokens: new Set(words(text)),
      text,
    };
  });

  const terms = queryTokens(query);
  if (!query.trim() || terms.length === 0) {
    return {
      tools: [],
      useCases: indexedCases.map(presentCase),
      fallback: false,
    };
  }

  const queryWantsClips = terms.some((term) => CLIP_TERMS.has(term));

  for (const tool of indexedTools) {
    const ownText = `${tool.name} ${tool.text}`;
    const ownTokens = new Set([...tool.nameTokens, ...tool.tokens]);
    // A highlight, clip, reel, or shorts query should not surface a voice tool
    // that only shares a word like "streams".
    if (queryWantsClips && !hitsClipTerms(ownText, ownTokens)) {
      tool.score = 0;
      continue;
    }
    const caseText = indexedCases
      .filter((useCase) => tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag)))
      .map((useCase) => useCase.text)
      .join(" ");
    tool.score =
      points(tool.name, tool.nameTokens, terms, 8, 5) +
      points(tool.text, tool.tokens, terms, 5, 3) +
      points(tool.tags, tool.tagTokens, terms, 2, 1) +
      points(caseText, new Set(words(caseText)), terms, 2, 1);
  }

  for (const useCase of indexedCases) {
    useCase.score = points(useCase.text, useCase.tokens, terms, 4, 3);
  }

  const matchedTools = indexedTools.filter((tool) => tool.score > 0).sort(byScore);
  const matchedCases = indexedCases.filter((useCase) => useCase.score > 0).sort(byScore);

  if (matchedTools.length > 0) {
    return {
      tools: matchedTools.slice(0, 6).map(presentTool),
      useCases: (matchedCases.length > 0 ? matchedCases : closestCases(indexedCases)).map(presentCase),
      fallback: false,
    };
  }

  const categoryScores = catalog.categories.map((category) => ({
    slug: category.slug,
    score: points(
      `${category.title} ${category.summary} ${category.slug}`,
      new Set(words(`${category.title} ${category.summary} ${category.slug}`)),
      terms,
      4,
      3,
    ),
  }));
  categoryScores.sort((a, b) => b.score - a.score);
  const bestCategory = categoryScores[0];
  let fallbackTools: IndexedTool[] = [];
  if (bestCategory && bestCategory.score > 0) {
    fallbackTools = indexedTools.filter((tool) => tool.categories.includes(bestCategory.slug));
  }
  const bestCase = [...indexedCases].sort(byScore)[0];
  if (fallbackTools.length === 0 && bestCase) {
    fallbackTools = indexedTools.filter((tool) =>
      tool.useCaseTags.some((tag) => bestCase.matchTags.includes(tag)),
    );
  }
  if (fallbackTools.length === 0) {
    const counts = new Map<string, number>();
    for (const tool of indexedTools) {
      for (const category of tool.categories) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    const largest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    fallbackTools = largest
      ? indexedTools.filter((tool) => tool.categories.includes(largest))
      : indexedTools;
  }

  return {
    tools: fallbackTools.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 6).map(presentTool),
    useCases: closestCases(indexedCases).map(presentCase),
    fallback: true,
  };
}

function closestCases(useCases: IndexedUseCase[]): IndexedUseCase[] {
  const matched = useCases.filter((useCase) => useCase.score > 0).sort(byScore);
  if (matched.length > 0) return matched;
  const sorted = [...useCases].sort(byScore);
  return sorted.slice(0, 1);
}

function byScore<T extends { score: number; name?: string; title?: string }>(a: T, b: T): number {
  if (b.score !== a.score) return b.score - a.score;
  return (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? "");
}

function presentTool(tool: IndexedTool): RankedTool {
  return {
    slug: tool.slug,
    name: tool.name,
    shortDescription: tool.shortDescription,
    smokeStatus: tool.smokeStatus,
    checkedDate: tool.checkedDate,
    score: tool.score,
  };
}

function presentCase(useCase: IndexedUseCase): RankedUseCase {
  return {
    slug: useCase.slug,
    title: useCase.title,
    summary: useCase.summary,
    toolCount: useCase.toolCount,
    smokeTestedCount: useCase.smokeTestedCount,
    score: useCase.score,
  };
}

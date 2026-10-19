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

/** Generic verbs and the word "agent" do not count as a match. */
export const GENERIC_MATCH_WORDS = ["find", "build", "help", "agent", "need", "make"] as const;
for (const word of GENERIC_MATCH_WORDS) STOPWORDS.add(word);
STOPWORDS.add("agents");

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

const INTENT_CASE: Record<string, string> = {
  video: "game-creative",
  code: "coding-agents",
  invest: "manage-portfolio",
  land: "find-land",
  workflow: "workflow-automation",
  crew: "multi-agent-workflows",
  research: "research-rag",
  meetings: "meetings-knowledge",
  browser: "tool-use-browser",
  npc: "game-npcs",
};

const INTENT_ORDER = Object.keys(INTENT_CASE);

const INTENT_PHRASES: Record<string, string[]> = {
  video: ["sizzle reel", "highlight reel", "youtube short"],
  code: ["coding agent", "write code"],
  invest: ["investment portfolio", "stock portfolio"],
  land: ["real estate", "find land"],
  workflow: ["personal tasks"],
  crew: ["multi-agent", "agent crew"],
  research: ["web search"],
  meetings: ["meeting notes"],
  browser: ["browser agent"],
  npc: ["game master", "in-game"],
};

const INTENT_TERMS: Record<string, string[]> = {
  video: ["video", "videos", "clip", "clips", "clipping", "youtube", "reel", "reels", "shorts", "short", "highlight", "highlights", "twitch", "stream", "streams", "streaming", "vod", "film", "movie", "movies", "tiktok", "caption", "captions"],
  code: ["code", "coding", "ide", "debug", "programming", "developer", "software", "repo", "github"],
  invest: ["invest", "investment", "investing", "portfolio", "stock", "stocks", "etf", "etfs", "retirement", "brokerage", "401k"],
  land: ["land", "parcel", "parcels", "acre", "acreage", "acres", "zoning", "property", "realtor"],
  workflow: ["automate", "automation", "automated", "automating", "workflow", "workflows", "email", "inbox", "zap"],
  crew: ["crew", "crews", "orchestrate", "orchestration"],
  research: ["crawl", "crawler", "rag", "vector", "retrieval"],
  meetings: ["meeting", "meetings", "transcript", "wiki", "notes"],
  browser: ["browser", "mcp", "scrape", "scraping"],
  npc: ["npc", "npcs", "discord"],
};

function scoreIntents(query: string): Record<string, number> {
  const lower = query.toLowerCase();
  const tokens = new Set(queryTokens(query));
  const scores: Record<string, number> = {};
  for (const id of INTENT_ORDER) {
    let score = 0;
    for (const phrase of INTENT_PHRASES[id] ?? []) {
      if (lower.includes(phrase)) score += 12;
    }
    for (const term of INTENT_TERMS[id] ?? []) {
      if (tokens.has(term) || lower.includes(term)) score += 8;
    }
    scores[id] = score;
  }
  return scores;
}

const GERUNDS: Record<string, string> = {
  clip: "clipping",
  make: "making",
  edit: "editing",
  write: "writing",
  plan: "planning",
  automate: "automating",
  create: "creating",
  generate: "generating",
  build: "building",
  cut: "cutting",
  find: "finding",
  manage: "managing",
};

export function cleanUserPhrase(query: string): string {
  let text = query.trim().replace(/\s+/g, " ").replace(/[.?!]+$/g, "");
  text = text.replace(
    /^(please\s+)?(i\s+)?(need|want)\s+(help\s+)?(with\s+)?/i,
    "",
  );
  text = text.replace(/^(agents?\s+to\s+help\s+me\s+)/i, "");
  text = text.replace(/^(help\s+me\s+)/i, "");
  text = text.replace(/\bmy\b/gi, "your");
  const verb = text.match(/^([a-z]+)\b/i);
  if (verb && GERUNDS[verb[1].toLowerCase()]) {
    text = `${GERUNDS[verb[1].toLowerCase()]}${text.slice(verb[1].length)}`;
  }
  return text || query.trim();
}

function extractPlace(query: string): string | null {
  const match = query.match(/\bin\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,3})\s*$/);
  if (!match) return null;
  const raw = match[1].trim();
  if (/^(the|a|my|your|order|general|mind)$/i.test(raw)) return null;
  return raw.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

export function jobLead(query: string, useCase?: UseCase): string {
  let phrase = useCase?.jobPhrase ?? cleanUserPhrase(query);
  const place = extractPlace(query);
  if (place && useCase?.jobPhrase && !phrase.toLowerCase().includes(place.toLowerCase())) {
    phrase = `${phrase} in ${place}`;
  }
  return `For ${phrase}, here's how each tool can help:`;
}

export function jobIntro(query: string, useCase?: UseCase): string {
  if (useCase?.intro) return useCase.intro;
  const phrase = cleanUserPhrase(query);
  return `AI agents can research, compare, summarize, draft, and automate parts of ${phrase}.`;
}

function whileYou(phrase: string): string {
  const gerund =
    /^(turning|automating|writing|researching|adding|splitting|planning|finding|managing|clipping|making|editing|creating|building)\b/i.test(
      phrase,
    );
  return gerund ? `while ${phrase}` : `as you ${phrase}`;
}

function whyItHelps(tool: IndexedTool, useCase: IndexedUseCase | null, query: string): string {
  const fit = useCase ? tool.source.useCaseFit?.[useCase.slug]?.trim() : "";
  if (fit) return fit;
  const name = tool.source.assistantName ?? tool.name.split("(")[0].trim();
  const phrase = useCase?.source.assistantContext ?? cleanUserPhrase(query);
  const when = whileYou(phrase);
  if (tool.source.generalPurpose && useCase?.source.assistantTask) {
    if (tool.source.assistantKind === "search" && useCase.source.searchTopic) {
      return `Ask ${name} to search public sources on ${useCase.source.searchTopic} ${when}.`;
    }
    return `Ask ${name} to ${useCase.source.assistantTask} ${when}.`;
  }
  const caps =
    tool.source.assistantKind === "search"
      ? "search public sources and summarize what those pages say"
      : "research a question, compare options, and draft next steps";
  return `Ask ${name} to ${caps} ${when}.`;
}

export type RankedTool = {
  slug: string;
  name: string;
  shortDescription: string;
  smokeStatus: SmokeStatus;
  checkedDate: string;
  score: number;
  whyItHelps: string;
  generalPurpose: boolean;
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
  /** True when no specialist use case matched and only general assistants are shown. */
  fallback: boolean;
  lowMatch: boolean;
  lead: string;
  intro: string;
  disclaimer: string | null;
};

type IndexedTool = {
  slug: string;
  name: string;
  shortDescription: string;
  smokeStatus: SmokeStatus;
  checkedDate: string;
  score: number;
  categories: string[];
  useCaseTags: string[];
  tokens: Set<string>;
  nameTokens: Set<string>;
  text: string;
  tags: string;
  tagTokens: Set<string>;
  source: Tool;
};

type IndexedUseCase = RankedUseCase & {
  matchTags: string[];
  tokens: Set<string>;
  text: string;
  source: UseCase;
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
    if (STOPWORDS.has(term)) continue;
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
      source: tool,
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
      source: useCase,
    };
  });

  const terms = queryTokens(query);
  if (!query.trim()) {
    return {
      tools: [],
      useCases: indexedCases.map(presentCase),
      fallback: false,
      lowMatch: false,
      lead: "",
      intro: "",
      disclaimer: null,
    };
  }

  const intentHits = scoreIntents(query);
  const videoEditing =
    intentHits.video > 0 &&
    /\b(edit|editing|clip|clips|clipping|cut|make|making)\b/i.test(query);
  if (videoEditing) intentHits.land = 0;

  const rankedIntents = INTENT_ORDER
    .map((id) => ({ id, score: intentHits[id] ?? 0 }))
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score);
  const topScore = rankedIntents[0]?.score ?? 0;
  const winning = rankedIntents.filter((item) => item.score >= topScore * 0.7);
  const winningCases = winning
    .map((item) => indexedCases.find((useCase) => useCase.slug === INTENT_CASE[item.id]))
    .filter((useCase): useCase is IndexedUseCase => Boolean(useCase));
  for (const [index, useCase] of winningCases.entries()) {
    useCase.score = winning[index]?.score ?? 0;
  }

  const queryWantsClips = terms.some((term) => CLIP_TERMS.has(term));
  const specialists: IndexedTool[] = [];
  for (const useCase of winningCases) {
    const tagged = indexedTools.filter(
      (tool) =>
        !tool.source.generalPurpose &&
        tool.useCaseTags.some((tag) => useCase.matchTags.includes(tag)),
    );
    for (const tool of tagged) {
      const ownText = `${tool.name} ${tool.text}`;
      const ownTokens = new Set([...tool.nameTokens, ...tool.tokens]);
      if (queryWantsClips && !hitsClipTerms(ownText, ownTokens)) continue;
      if (
        useCase.slug === "game-creative" &&
        intentHits.video > 0 &&
        !/\b(video|videos|clip|clips|clipping|youtube|caption|captions|stream|streams|reel|reels|edit|editing)\b/i.test(
          ownText,
        )
      ) {
        continue;
      }
      const overlap = points(ownText, ownTokens, terms, 5, 3);
      const recIndex = useCase.source.recommended.findIndex(
        (item) => item.toolId === tool.source.id,
      );
      const recBonus = recIndex >= 0 ? 8 - recIndex : 0;
      tool.score = useCase.score * 10 + overlap + recBonus;
      if (!specialists.some((item) => item.slug === tool.slug)) specialists.push(tool);
    }
  }
  specialists.sort(byScore);

  const primary = winningCases[0] ?? null;
  const lowMatch = winningCases.length === 0;
  const assistantOrder = ["claude", "chatgpt", "gemini", "perplexity"];
  const assistants = indexedTools
    .filter((tool) => tool.source.generalPurpose)
    .sort(
      (a, b) =>
        assistantOrder.indexOf(a.slug) - assistantOrder.indexOf(b.slug),
    );
  const chosenAssistants = assistants.filter(
    (tool) => !specialists.some((item) => item.slug === tool.slug),
  );
  const selected = [...specialists.slice(0, 5), ...chosenAssistants];

  return {
    tools: selected.map((tool) =>
      presentTool(
        tool,
        whyItHelps(tool, primary, query),
        Boolean(tool.source.generalPurpose),
      ),
    ),
    useCases: winningCases.map(presentCase),
    fallback: lowMatch,
    lowMatch,
    lead: jobLead(query, primary?.source),
    intro: jobIntro(query, primary?.source),
    disclaimer: primary?.source.disclaimer ?? null,
  };
}

function byScore<T extends { score: number; name?: string; title?: string }>(a: T, b: T): number {
  if (b.score !== a.score) return b.score - a.score;
  return (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? "");
}

function presentTool(tool: IndexedTool, whyItHelps: string, generalPurpose: boolean): RankedTool {
  return {
    slug: tool.slug,
    name: tool.name,
    shortDescription: tool.shortDescription,
    smokeStatus: tool.smokeStatus,
    checkedDate: tool.checkedDate,
    score: tool.score,
    whyItHelps,
    generalPurpose,
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

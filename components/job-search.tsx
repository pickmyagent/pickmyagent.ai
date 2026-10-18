"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/badges";
import { RankingNote } from "@/components/ranking-note";
import { formatDate } from "@/lib/format";
import { rankCatalogQuery } from "@/lib/search";
import type { Category, Tool, UseCase } from "@/lib/types";

const PLACEHOLDERS = [
  "Build a multi-agent research crew",
  "Add NPCs that remember the player",
  "Cut a Twitch VOD into Shorts",
  "Automate Discord mods with an agent",
  "Code agent that uses the browser",
];

export function JobSearch({
  useCases,
  tools,
  categories,
}: {
  useCases: UseCase[];
  tools: Tool[];
  categories: Category[];
}) {
  const [query, setQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches || paused || query) return;
    const id = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [paused, query]);

  const trimmed = query.trim();
  const ranked = useMemo(
    () => rankCatalogQuery(trimmed, { tools, useCases, categories }),
    [tools, useCases, categories, trimmed],
  );
  const visibleCases = ranked.useCases;
  const visibleTools = ranked.tools;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = document.getElementById(trimmed ? "match-results" : "use-cases");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="frame border border-line bg-panel p-4 sm:p-5" role="search">
        <label htmlFor="job-query" className="block text-sm font-medium">
          What are you trying to do?
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="job-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            className="h-12 min-w-0 flex-1 border border-line bg-bg px-3 text-base"
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn-gold h-12 px-5 font-semibold"
          >
            Find agents
          </button>
          <Link
            href="/use-cases"
            className="inline-flex h-12 items-center justify-center border border-line px-5 font-semibold hover:border-gold"
          >
            Browse use cases
          </Link>
        </div>
      </form>

      <RankingNote className="mt-4" />

      <section id="use-cases" className="mt-14 scroll-mt-24">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Top use cases</h2>
            <p className="mt-2 text-muted">Start from the job, not a wall of logos.</p>
          </div>
          <p className="font-mono text-xs text-muted" aria-live="polite">
            {trimmed
              ? `${visibleCases.length} use case${visibleCases.length === 1 ? "" : "s"} · ${visibleTools.length} matching tool${visibleTools.length === 1 ? "" : "s"}`
              : `${useCases.length} use cases`}
          </p>
        </div>

        {trimmed ? (
          <div id="match-results" className="mb-8 scroll-mt-24">
            <h3 className="font-mono text-xs tracking-[0.16em] text-gold uppercase">
              {ranked.fallback ? "Closest matches" : "Tools that match"}
            </h3>
            {ranked.fallback ? (
              <p className="mt-3 text-muted">
                Nothing matched that wording closely. These are the closest tools in the catalog.{" "}
                <Link href="/submit" className="text-gold underline">
                  Suggest a tool
                </Link>
              </p>
            ) : null}
            {visibleTools.length === 0 ? (
              <p className="mt-3 text-muted">
                <Link href="/submit" className="text-gold underline">
                  Suggest a tool
                </Link>
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-line border border-line bg-panel">
                {visibleTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="flex flex-col gap-2 px-4 py-3 hover:bg-panel-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span>
                        <span className="font-semibold">{tool.name}</span>
                        <span className="mt-1 block text-sm text-muted">
                          {tool.shortDescription}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={tool.smokeStatus} />
                        <span className="font-mono text-xs text-muted">
                          {formatDate(tool.checkedDate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {visibleCases.length === 0 ? (
          <p className="text-muted">
            <Link href="/submit" className="text-gold underline">
              Suggest a tool
            </Link>
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {visibleCases.map((useCase, index) => (
              <li key={useCase.slug}>
                <Link
                  href={`/use-cases/${useCase.slug}`}
                  className="flex h-full flex-col border border-line bg-panel p-4 hover:border-gold"
                >
                  <span className="font-mono text-xs text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-2 text-lg font-semibold tracking-tight">
                    {useCase.title}
                  </span>
                  <span className="mt-2 text-sm leading-relaxed text-muted">
                    {useCase.summary}
                  </span>
                  <span className="mt-4 font-mono text-xs text-muted">
                    {useCase.toolCount} tools
                    {useCase.smokeTestedCount > 0
                      ? ` · ${useCase.smokeTestedCount} smoke-tested`
                      : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

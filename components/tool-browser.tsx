"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ToolCard } from "@/components/tool-card";
import { textMatchesQuery } from "@/lib/search";
import { PRICING_LABELS, TOOL_TYPE_LABELS } from "@/lib/labels";
import { toolHaystack } from "@/lib/query";
import type { PricingModel, SmokeStatus, Tool, ToolType, UseCase } from "@/lib/types";

const STATUS_OPTIONS: { value: "all" | SmokeStatus; label: string }[] = [
  { value: "all", label: "Any check" },
  { value: "tested-hands-on", label: "Smoke-tested" },
  { value: "verified-docs-only", label: "Docs checked" },
  { value: "untested", label: "Not fully checked" },
];

export function ToolBrowser({
  tools,
  useCases,
  recentReleaseSince,
}: {
  tools: Tool[];
  useCases: UseCase[];
  recentReleaseSince: string;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [useCase, setUseCase] = useState(searchParams.get("useCase") ?? "all");
  const [type, setType] = useState(searchParams.get("type") ?? "all");
  const [pricing, setPricing] = useState(searchParams.get("pricing") ?? "all");
  const [status, setStatus] = useState(searchParams.get("status") ?? "all");
  const [openSourceOnly, setOpenSourceOnly] = useState(
    searchParams.get("oss") === "1",
  );

  const filtered = useMemo(() => {
    const selected = useCases.find((item) => item.slug === useCase);
    return tools.filter((tool) => {
      if (!textMatchesQuery(query, `${toolHaystack(tool)} ${tool.name}`)) return false;
      if (selected && !tool.useCaseTags.some((tag) => selected.matchTags.includes(tag))) {
        return false;
      }
      if (type !== "all" && !tool.toolTypes.includes(type as ToolType)) return false;
      if (pricing !== "all" && !tool.pricingModel.includes(pricing as PricingModel)) {
        return false;
      }
      if (status !== "all" && tool.smokeStatus !== status) return false;
      if (openSourceOnly && tool.openSource !== true) return false;
      return true;
    });
  }, [tools, useCases, query, useCase, type, pricing, status, openSourceOnly]);

  const selectClass = "h-11 w-full border border-line bg-bg px-2 text-sm";

  return (
    <div>
      <form
        className="grid gap-3 border border-line bg-panel p-4 md:grid-cols-2 lg:grid-cols-3"
        role="search"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="md:col-span-2 lg:col-span-3">
          <label htmlFor="tool-query" className="block text-sm font-medium">
            Search tools
          </label>
          <input
            id="tool-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 h-11 w-full border border-line bg-bg px-3"
          />
        </div>
        <div>
          <label htmlFor="filter-usecase" className="block text-sm font-medium">
            Use case
          </label>
          <select
            id="filter-usecase"
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            className={`mt-1 ${selectClass}`}
          >
            <option value="all">All use cases</option>
            {useCases.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="filter-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={`mt-1 ${selectClass}`}
          >
            <option value="all">All types</option>
            {Object.entries(TOOL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-pricing" className="block text-sm font-medium">
            Pricing model
          </label>
          <select
            id="filter-pricing"
            value={pricing}
            onChange={(event) => setPricing(event.target.value)}
            className={`mt-1 ${selectClass}`}
          >
            <option value="all">Any pricing</option>
            {Object.entries(PRICING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-status" className="block text-sm font-medium">
            Check status
          </label>
          <select
            id="filter-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={`mt-1 ${selectClass}`}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openSourceOnly}
              onChange={(event) => setOpenSourceOnly(event.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            Open source only
          </label>
        </div>
      </form>

      <p className="mt-4 font-mono text-xs text-muted" aria-live="polite">
        {filtered.length} tool{filtered.length === 1 ? "" : "s"}. Sorted by how
        much we checked, then name. Not a ranking.
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 text-muted">Nothing matched those filters.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {filtered.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} recentReleaseSince={recentReleaseSince} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

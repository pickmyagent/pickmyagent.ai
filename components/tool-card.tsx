import Link from "next/link";
import { ToolBadges } from "@/components/badges";
import { ToolPricing } from "@/components/tool-pricing";
import { ToolTradeoffs } from "@/components/tool-tradeoffs";
import { formatDate } from "@/lib/format";
import type { Tool } from "@/lib/types";

function monogram(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ToolCard({
  tool,
  recentReleaseSince,
  why,
}: {
  tool: Tool;
  recentReleaseSince: string;
  why?: string;
}) {
  return (
    <article className="flex h-full flex-col border border-line bg-panel">
      <Link
        href={`/tools/${tool.slug}`}
        className="flex flex-col p-4 no-underline hover:bg-panel-2"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">{tool.name}</h3>
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center border border-line bg-bg font-mono text-xs text-gold"
          >
            {monogram(tool.name)}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {tool.shortDescription}
        </p>
        {why ? (
          <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-relaxed text-text">
            {why}
          </p>
        ) : null}
        <div className="mt-3">
          <ToolBadges tool={tool} recentReleaseSince={recentReleaseSince} />
        </div>
        <p className="mt-auto pt-4 font-mono text-xs text-muted">
          Checked {formatDate(tool.checkedDate)}
        </p>
      </Link>
      <div className="border-t border-line px-4 py-3">
        <ToolPricing tool={tool} />
        <div className="mt-3 border-t border-line pt-3">
          <ToolTradeoffs tool={tool} />
        </div>
      </div>
    </article>
  );
}

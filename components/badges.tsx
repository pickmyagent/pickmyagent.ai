import { smokeLabel } from "@/lib/labels";
import { isRecentRelease } from "@/lib/query";
import type { SmokeStatus, Tool } from "@/lib/types";

function Pill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "gold" | "ice" | "amber" | "line";
}) {
  const tones = {
    gold: "border-[#c9a24a] bg-[#2c2414] text-gold",
    ice: "border-ice/50 bg-[#163044] text-ice",
    amber: "border-amber/50 bg-[#3a2d12] text-amber",
    line: "border-line bg-panel-2 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] leading-5 tracking-wide uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: SmokeStatus }) {
  const tone =
    status === "tested-hands-on"
      ? "gold"
      : status === "verified-docs-only"
        ? "ice"
        : "amber";
  return <Pill tone={tone}>{smokeLabel(status)}</Pill>;
}

export function ToolBadges({
  tool,
  recentReleaseSince,
}: {
  tool: Tool;
  recentReleaseSince: string;
}) {
  const showAgent =
    tool.toolTypes.includes("agent") || tool.toolTypes.includes("framework");
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusBadge status={tool.smokeStatus} />
      {tool.openSource === true ? <Pill tone="line">Open source</Pill> : null}
      {isRecentRelease(tool, recentReleaseSince) ? (
        <Pill tone="amber">New release</Pill>
      ) : null}
      {showAgent ? <Pill tone="line">Agent</Pill> : null}
      {tool.featured && tool.featuredPaid ? (
        <Pill tone="amber">Featured (paid)</Pill>
      ) : null}
      {tool.featured && !tool.featuredPaid ? (
        <Pill tone="line">Featured</Pill>
      ) : null}
    </div>
  );
}

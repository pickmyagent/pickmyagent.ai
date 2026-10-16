import { ExternalLink } from "@/components/external-link";
import { formatDate } from "@/lib/format";
import type { Tool } from "@/lib/types";

export function formatMonthlyPrice(amount: number): string {
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `$${text}/mo`;
}

function CheckPricing({ href }: { href: string | null }) {
  if (!href) return <span>Check pricing</span>;
  return (
    <ExternalLink href={href} className="text-gold underline">
      Check pricing
    </ExternalLink>
  );
}

export function ToolPricing({ tool }: { tool: Tool }) {
  const href = tool.pricingUrl ?? tool.websiteUrl;
  const free =
    tool.freeTier === null
      ? null
      : tool.freeTier
        ? `Yes${tool.freeTierNotes ? ` · ${tool.freeTierNotes}` : ""}`
        : "No";

  return (
    <div className="text-sm leading-relaxed">
      <p>
        <span className="text-muted">Free tier: </span>
        {free ?? <CheckPricing href={href} />}
      </p>
      <p>
        <span className="text-muted">From: </span>
        {tool.startingPrice === null ? (
          <CheckPricing href={href} />
        ) : (
          formatMonthlyPrice(tool.startingPrice)
        )}
      </p>
      {tool.freeTrial ? (
        <p>
          <span className="text-muted">Trial: </span>
          {tool.freeTrial}
        </p>
      ) : null}
      {tool.pricingCheckedAt ? (
        <p className="mt-1 font-mono text-xs text-muted">
          Checked {formatDate(tool.pricingCheckedAt)}
        </p>
      ) : null}
    </div>
  );
}

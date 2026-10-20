import { ExternalLink } from "@/components/external-link";
import { formatDate } from "@/lib/format";
import { PRICING_UNKNOWN_LABEL, PRICING_UNKNOWN_LINK } from "@/lib/tool-page-copy";
import type { Tool } from "@/lib/types";

export function formatMonthlyPrice(amount: number): string {
  const text = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `$${text}/mo`;
}

function SeeTheirSite({ href }: { href: string }) {
  return (
    <p>
      <span className="text-muted">{PRICING_UNKNOWN_LABEL} </span>
      <ExternalLink href={href} className="text-gold underline">
        {PRICING_UNKNOWN_LINK}
      </ExternalLink>
    </p>
  );
}

export function ToolPricing({ tool }: { tool: Tool }) {
  const href = tool.pricingUrl ?? tool.websiteUrl;
  const freeKnown = tool.freeTier !== null;
  const price = tool.startingPrice;
  const free = tool.freeTier
    ? `Yes${tool.freeTierNotes ? ` · ${tool.freeTierNotes}` : ""}`
    : "No";

  return (
    <div className="text-sm leading-relaxed">
      {freeKnown || price !== null ? (
        <>
          {freeKnown ? (
            <p>
              <span className="text-muted">Free tier: </span>
              {free}
            </p>
          ) : null}
          {price !== null ? (
            <p>
              <span className="text-muted">From: </span>
              {formatMonthlyPrice(price)}
            </p>
          ) : (
            <SeeTheirSite href={href} />
          )}
        </>
      ) : (
        <SeeTheirSite href={href} />
      )}
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

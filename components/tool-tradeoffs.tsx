import type { Tool } from "@/lib/types";

export function ToolTradeoffs({ tool }: { tool: Tool }) {
  return (
    <ul className="space-y-2 text-sm leading-relaxed">
      <li className="flex gap-2">
        <span
          aria-hidden="true"
          className="w-4 shrink-0 font-mono font-semibold text-good"
        >
          +
        </span>
        <span>
          <span className="sr-only">Strength. </span>
          {tool.strength}
        </span>
      </li>
      <li className="flex gap-2">
        <span
          aria-hidden="true"
          className="w-4 shrink-0 font-mono font-semibold text-amber"
        >
          −
        </span>
        <span>
          <span className="sr-only">Weakness. </span>
          {tool.weakness}
        </span>
      </li>
    </ul>
  );
}

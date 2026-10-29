import { readFileSync } from "node:fs";
import { allowedFamilies, familyAllows, toolFamilies } from "../lib/capability-match.ts";
import type { Catalog, Tool } from "../lib/types.ts";
import { grammarProblems } from "./grammar-gate.ts";
import { HELD_OUT_BROAD } from "./held-out-broad.ts";
import { rankObserved } from "./rank-observed.ts";

const catalog = JSON.parse(readFileSync(new URL("../content/catalog.json", import.meta.url), "utf8")) as Catalog;

export type BroadMiss = {
  query: string;
  domains: string[];
  reason: string;
  top: string[];
};

export function gradeBroad(source: Catalog = catalog): { total: number; passed: number; misses: BroadMiss[] } {
  const bySlug = new Map(source.tools.map((tool) => [tool.slug, tool]));
  const misses: BroadMiss[] = [];
  let passed = 0;
  for (const item of HELD_OUT_BROAD) {
    const ranked = rankObserved(item.query, source);
    const allowed = allowedFamilies(item.domains);
    const top5 = ranked.tools.slice(0, 5);
    const specialists = top5
      .map((tool) => bySlug.get(tool.slug))
      .filter((tool): tool is Tool => Boolean(tool && !tool.generalPurpose));
    const offDomain = specialists.filter((tool) => !familyAllows(toolFamilies(tool), allowed));
    const top3Specialists = ranked.tools.slice(0, 3).filter((tool) => !tool.generalPurpose);
    const top3On = top3Specialists.some((tool) => {
      const sourceTool = bySlug.get(tool.slug);
      return sourceTool ? familyAllows(toolFamilies(sourceTool), allowed) : false;
    });
    const grammar = [
      ...grammarProblems(ranked.lead, "header", item.query),
      ...grammarProblems(ranked.intro, "intro", item.query),
      ...ranked.tools.flatMap((tool) => grammarProblems(tool.whyItHelps, "why", item.query)),
    ];
    const reasons: string[] = [];
    if (!top3On) reasons.push("no specialist in top 3");
    if (offDomain.length > 0) reasons.push(`off-domain ${offDomain.map((tool) => tool.name).join(", ")}`);
    if (grammar.length > 0) reasons.push(`grammar ${grammar.slice(0, 3).join("; ")}`);
    if (reasons.length === 0) passed += 1;
    else if (misses.length < 80) {
      misses.push({
        query: item.query,
        domains: item.domains,
        reason: reasons.join("; "),
        top: ranked.tools.slice(0, 5).map((tool) => tool.name),
      });
    }
  }
  return { total: HELD_OUT_BROAD.length, passed, misses };
}

const invoked = process.argv[1]?.includes("grade-broad");
if (invoked) {
  const report = gradeBroad();
  const rate = report.passed / report.total;
  console.log(`broad ${report.passed}/${report.total} ${(rate * 100).toFixed(1)}%`);
  for (const miss of report.misses.slice(0, 40)) {
    console.log(`- ${miss.domains.join("+")} ${miss.reason} :: ${miss.query}`);
    console.log(`  ${miss.top.join(" | ")}`);
  }
}

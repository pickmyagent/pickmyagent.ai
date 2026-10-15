import type { PricingModel, SmokeStatus, ToolType } from "@/lib/types";

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  agent: "Agent",
  framework: "Framework",
  copilot: "Copilot",
  automation: "Automation",
  model_api: "Model API",
  creative: "Creative",
  infra: "Infra",
  other: "Other",
};

export const PRICING_LABELS: Record<PricingModel, string> = {
  free: "Free",
  freemium: "Free tier",
  subscription: "Subscription",
  usage: "Usage-based",
  open_source: "Open source",
  enterprise: "Enterprise",
  contact: "Contact for price",
};

export const PLATFORM_LABELS: Record<string, string> = {
  web: "Web",
  discord: "Discord",
  unity: "Unity",
  unreal: "Unreal",
  godot: "Godot",
  ide: "IDE",
  cli: "CLI",
  self_host: "Self-host",
  desktop: "Desktop",
};

export const TAG_LABELS: Record<string, string> = {
  "multi-agent-workflows": "Multi-agent workflows",
  "coding-agents": "Coding agents",
  "tool-use-browser": "Tools & browsers",
  "workflow-automation": "Workflow automation",
  "research-rag": "Research & RAG",
  "game-npcs": "Game NPCs",
  "game-creative": "Game art & 3D",
  "creator-video-audio": "Video, voice & streams",
  "meetings-knowledge": "Meetings & knowledge",
};

export function smokeLabel(status: SmokeStatus): string {
  if (status === "tested-hands-on") return "Smoke-tested";
  if (status === "verified-docs-only") return "Docs checked";
  return "Not fully checked";
}

export function freeTierLabel(value: boolean | null): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Unconfirmed";
}

export function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform;
}

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? tag;
}

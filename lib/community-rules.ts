export const COMMUNITY_LIMITS = {
  titleMin: 8,
  titleMax: 120,
  bodyMax: 4000,
  reportNoteMax: 280,
  postsPerWindow: 5,
  windowMinutes: 10,
  newAccountDays: 7,
  newAccountLinks: 1,
} as const;

export function countLinks(text: string): number {
  const matches = text.match(/https?:\/\//gi);
  return matches ? matches.length : 0;
}

export function isCommunityEnabled(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function adminEmailList(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailList().includes(email.toLowerCase());
}

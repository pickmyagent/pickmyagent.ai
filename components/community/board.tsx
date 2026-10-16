import Link from "next/link";
import { SignInButtons, SignOutButton } from "@/components/community/auth-controls";
import { formatDate } from "@/lib/format";
import { isAdminEmail } from "@/lib/community-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Category = { slug: string; title: string; description: string };

function relatedName(value: { display_name?: string; title?: string } | { display_name?: string; title?: string }[] | null) {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.display_name ?? row?.title ?? "Member";
}

function replyCount(value: { count: number }[] | null) {
  return value?.[0]?.count ?? 0;
}

export async function CommunityBoard({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; auth?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("slug, title, description")
    .order("sort_order");

  let profileName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    profileName = profile?.display_name ?? user.email ?? "Member";
  }

  const selected = categories?.some((category) => category.slug === params.category)
    ? params.category
    : undefined;

  let threadQuery = supabase
    .from("threads")
    .select(
      "id, title, last_activity_at, category_slug, profiles!threads_author_id_fkey(display_name), categories!threads_category_slug_fkey(title), replies(count)",
    )
    .order("last_activity_at", { ascending: false });
  if (selected) threadQuery = threadQuery.eq("category_slug", selected);
  const { data: threads, error: threadError } = await threadQuery;

  const loadError = categoryError?.message ?? threadError?.message;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">Community</p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Message board</h1>
        {user ? (
          <Link href="/community/new" className="btn-gold inline-flex h-11 items-center px-4 text-sm font-semibold">
            New thread
          </Link>
        ) : null}
      </div>
      <p className="mt-3 max-w-2xl text-muted">
        Talk about tools, clips, and what is actually worth using. Reading is open. Posting needs a sign-in.
      </p>

      <div className="mt-6">
        {user ? (
          <SignOutButton name={profileName ?? "Member"} />
        ) : (
          <SignInButtons />
        )}
        {params.auth === "error" ? (
          <p className="mt-3 text-sm text-amber">Sign-in did not finish. Try again.</p>
        ) : null}
        {user && isAdminEmail(user.email) ? (
          <p className="mt-3 text-sm text-gold">Admin tools are on for this account.</p>
        ) : null}
      </div>

      <ul className="mt-8 flex flex-wrap gap-2">
        <li>
          <Link
            href="/community"
            className={
              selected
                ? "inline-flex border border-line px-3 py-2 text-sm text-muted hover:border-gold"
                : "inline-flex border border-gold px-3 py-2 text-sm text-gold"
            }
          >
            All
          </Link>
        </li>
        {(categories ?? []).map((category: Category) => (
          <li key={category.slug}>
            <Link
              href={`/community?category=${category.slug}`}
              className={
                selected === category.slug
                  ? "inline-flex border border-gold px-3 py-2 text-sm text-gold"
                  : "inline-flex border border-line px-3 py-2 text-sm text-muted hover:border-gold"
              }
            >
              {category.title}
            </Link>
          </li>
        ))}
      </ul>

      {loadError ? (
        <p className="mt-8 border border-line bg-panel p-4 text-muted">
          The board could not be loaded. Check the Supabase URL and key, then run the SQL migration.
        </p>
      ) : threads && threads.length > 0 ? (
        <ul className="mt-8 divide-y divide-line border border-line bg-panel">
          {threads.map((thread) => {
            const count = replyCount(thread.replies as { count: number }[] | null);
            return (
              <li key={thread.id}>
                <Link href={`/community/t/${thread.id}`} className="block px-4 py-4 hover:bg-panel-2">
                  <p className="font-mono text-xs tracking-wide text-gold uppercase">
                    {relatedName(thread.categories as { title: string } | { title: string }[] | null)}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{thread.title}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {relatedName(thread.profiles as { display_name: string } | { display_name: string }[] | null)}
                    {" · "}
                    {count === 1 ? "1 reply" : `${count} replies`}
                    {" · Last activity "}
                    {formatDate(thread.last_activity_at)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 border border-line bg-panel p-4 text-muted">
          No threads in this category yet.
        </p>
      )}
    </div>
  );
}

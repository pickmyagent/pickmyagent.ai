import Link from "next/link";
import { notFound } from "next/navigation";
import { SignInButtons } from "@/components/community/auth-controls";
import { HideButton, ReplyForm, ReportButton } from "@/components/community/post-forms";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatDate } from "@/lib/format";
import { isAdminEmail } from "@/lib/community-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function relatedName(
  value: { display_name?: string; title?: string } | { display_name?: string; title?: string }[] | null,
) {
  const row = Array.isArray(value) ? value[0] : value;
  return row?.display_name ?? row?.title ?? "Member";
}

export async function ThreadView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: thread } = await supabase
    .from("threads")
    .select(
      "id, title, body, created_at, category_slug, profiles!threads_author_id_fkey(display_name), categories!threads_category_slug_fkey(title)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!thread) notFound();

  const { data: replies } = await supabase
    .from("replies")
    .select("id, body, created_at, profiles!replies_author_id_fkey(display_name)")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  let reportedThread = false;
  const reportedReplies = new Set<string>();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profile) {
      const { data: reports } = await supabase
        .from("reports")
        .select("thread_id, reply_id")
        .eq("reporter_id", profile.id);
      for (const report of reports ?? []) {
        if (report.thread_id === id) reportedThread = true;
        if (report.reply_id) reportedReplies.add(report.reply_id);
      }
    }
  }

  const canModerate = isAdminEmail(user?.email);
  const categoryTitle = relatedName(
    thread.categories as { title: string } | { title: string }[] | null,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/community", label: "Community" },
          { label: thread.title },
        ]}
      />
      <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">{categoryTitle}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{thread.title}</h1>
      <p className="mt-3 text-sm text-muted">
        {relatedName(thread.profiles as { display_name: string } | { display_name: string }[] | null)}
        {" · "}
        {formatDate(thread.created_at)}
      </p>
      <div className="mt-6 border border-line bg-panel p-4 whitespace-pre-wrap break-words leading-relaxed">
        {thread.body}
      </div>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        {user && !reportedThread ? <ReportButton threadId={thread.id} /> : null}
        {user && reportedThread ? <p className="text-sm text-muted">You reported this thread.</p> : null}
        {canModerate ? <HideButton threadId={thread.id} /> : null}
      </div>

      <h2 className="mt-10 text-xl font-semibold">
        {(replies ?? []).length === 1 ? "1 reply" : `${replies?.length ?? 0} replies`}
      </h2>
      <ul className="mt-4 space-y-3">
        {(replies ?? []).map((reply) => (
          <li key={reply.id} className="border border-line bg-panel p-4">
            <p className="text-sm text-muted">
              {relatedName(reply.profiles as { display_name: string } | { display_name: string }[] | null)}
              {" · "}
              {formatDate(reply.created_at)}
            </p>
            <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{reply.body}</p>
            <div className="mt-3 flex flex-wrap items-start gap-4">
              {user && !reportedReplies.has(reply.id) ? (
                <ReportButton replyId={reply.id} />
              ) : null}
              {user && reportedReplies.has(reply.id) ? (
                <p className="text-sm text-muted">You reported this reply.</p>
              ) : null}
              {canModerate ? <HideButton threadId={thread.id} replyId={reply.id} /> : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {user ? (
          <ReplyForm threadId={thread.id} />
        ) : (
          <div className="border border-line bg-panel p-4">
            <p className="mb-4 text-muted">Sign in to reply. Reading stays open.</p>
            <SignInButtons />
          </div>
        )}
      </div>
      <p className="mt-6">
        <Link href="/community" className="text-sm text-gold hover:underline">
          Back to the board
        </Link>
      </p>
    </div>
  );
}

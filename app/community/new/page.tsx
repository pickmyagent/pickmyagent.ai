import { Suspense } from "react";
import Link from "next/link";
import { SignInButtons } from "@/components/community/auth-controls";
import { CommunityComingSoon } from "@/components/community/coming-soon";
import { ThreadForm } from "@/components/community/post-forms";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { isCommunityEnabled } from "@/lib/community-rules";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "New thread",
  description: "Start a community thread about an AI tool or a job you want done.",
  path: "/community/new",
});

async function NewThread({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, title")
    .order("sort_order");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/community", label: "Community" },
          { label: "New thread" },
        ]}
      />
      <PageHeader
        eyebrow="Community"
        title="New thread"
        lede="Ask about a real job. The board is for members who are signed in."
      />
      {user ? (
        <ThreadForm
          categories={categories ?? []}
          defaultCategory={params.category}
        />
      ) : (
        <div className="border border-line bg-panel p-4">
          <p className="mb-4 text-muted">Sign in to start a thread.</p>
          <SignInButtons />
          <p className="mt-4">
            <Link href="/community" className="text-sm text-gold hover:underline">
              Back to the board
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

export default function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  if (!isCommunityEnabled()) return <CommunityComingSoon />;
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-3xl px-4 py-10 text-muted sm:px-6">Loading…</p>
      }
    >
      <NewThread searchParams={searchParams} />
    </Suspense>
  );
}

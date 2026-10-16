import { Suspense } from "react";
import { CommunityComingSoon } from "@/components/community/coming-soon";
import { ThreadView } from "@/components/community/thread-view";
import { isCommunityEnabled } from "@/lib/community-rules";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return pageMetadata({
    title: "Community thread",
    description: "A thread on the PickMyAgent community board.",
    path: `/community/t/${id}`,
  });
}

export default function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isCommunityEnabled()) return <CommunityComingSoon />;
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-3xl px-4 py-10 text-muted sm:px-6">Loading the thread…</p>
      }
    >
      <ThreadView params={params} />
    </Suspense>
  );
}

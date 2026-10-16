import { Suspense } from "react";
import { CommunityBoard } from "@/components/community/board";
import { CommunityComingSoon } from "@/components/community/coming-soon";
import { isCommunityEnabled } from "@/lib/community-rules";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Community",
  description: "A free message board for talking about AI tools, clips, and what is worth using.",
  path: "/community",
});

export default function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; auth?: string }>;
}) {
  if (!isCommunityEnabled()) return <CommunityComingSoon />;
  return (
    <Suspense
      fallback={
        <p className="mx-auto max-w-3xl px-4 py-10 text-muted sm:px-6">Loading the board…</p>
      }
    >
      <CommunityBoard searchParams={searchParams} />
    </Suspense>
  );
}

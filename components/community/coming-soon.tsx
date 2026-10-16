import { PageHeader } from "@/components/page-header";

export function CommunityComingSoon() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Community"
        title="Coming soon"
        lede="The message board is not connected yet."
      />
    </div>
  );
}

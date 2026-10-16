import { NewsletterSignup } from "@/components/newsletter-signup";
import { PageHeader } from "@/components/page-header";

export function CommunityComingSoon() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Community"
        title="The PickMyAgent community is coming soon"
        lede="A place to debate tools, share favorites, and help other creators."
      />
      <NewsletterSignup idPrefix="community-newsletter" className="max-w-xl" />
    </div>
  );
}

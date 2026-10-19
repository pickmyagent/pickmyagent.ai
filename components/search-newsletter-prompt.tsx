"use client";

import { useEffect, useState } from "react";
import { NewsletterSignup } from "@/components/newsletter-signup";

const STORAGE_KEY = "pickmyagent-search-newsletter-dismissed";
const DISMISS_EVENT = "pickmyagent-search-newsletter-dismiss";

function readDismissed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useSearchNewsletterDismissed() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const sync = () => setDismissed(readDismissed());
    sync();
    window.addEventListener(DISMISS_EVENT, sync);
    return () => window.removeEventListener(DISMISS_EVENT, sync);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing can block storage. Hide the prompt anyway.
    }
    setDismissed(true);
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return { dismissed, dismiss };
}

export function SearchNewsletterPrompt({
  idPrefix,
  className,
  onDismiss,
}: {
  idPrefix: string;
  className?: string;
  onDismiss: () => void;
}) {
  return (
    <aside className={`border border-line border-l-4 border-l-gold bg-panel p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <NewsletterSignup
          idPrefix={idPrefix}
          className="min-w-0 flex-1"
          compact
          heading="Get one new AI tool every Monday"
          description="One honest tool pick, the AI launches that matter, and a straight answer to a real question. Free."
        />
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-muted hover:text-gold"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

export type NewsletterConfig = {
  provider: "buttondown" | "beehiiv" | null;
  action: string | null;
};

export function getNewsletterConfig(): NewsletterConfig {
  const buttondown = process.env.NEXT_PUBLIC_BUTTONDOWN_USERNAME?.trim();
  const beehiiv = process.env.NEXT_PUBLIC_BEEHIIV_EMBED_URL?.trim();
  if (buttondown) {
    return {
      provider: "buttondown",
      action: `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(buttondown)}`,
    };
  }
  if (beehiiv) {
    return { provider: "beehiiv", action: beehiiv };
  }
  return { provider: null, action: null };
}

export function getSubmitEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUBMIT_EMAIL?.trim();
  return email || null;
}

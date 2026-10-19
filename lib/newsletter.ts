/** Public Beehiiv publication. Not a secret. Override with NEXT_PUBLIC_NEWSLETTER_FORM_URL. */
export const BEEHIIV_PUBLICATION_URL =
  "https://pickmyagent.beehiiv.com";

export function getNewsletterPublicationUrl(): string {
  const override = process.env.NEXT_PUBLIC_NEWSLETTER_FORM_URL?.trim().replace(
    /\/+$/,
    "",
  );
  return override || BEEHIIV_PUBLICATION_URL;
}

/** Hosted subscribe page. A GET with `email` opens it; Beehiiv does not prefill that field. */
export function getNewsletterFormUrl(): string {
  const base = getNewsletterPublicationUrl();
  return base.endsWith("/subscribe") ? base : `${base}/subscribe`;
}

export function getSubmitEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUBMIT_EMAIL?.trim();
  return email || null;
}

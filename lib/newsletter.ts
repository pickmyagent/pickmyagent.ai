export function getNewsletterFormUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_NEWSLETTER_FORM_URL?.trim();
  return url || null;
}

export function getSubmitEmail(): string | null {
  const email = process.env.NEXT_PUBLIC_SUBMIT_EMAIL?.trim();
  return email || null;
}

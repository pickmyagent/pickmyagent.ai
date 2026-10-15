"use client";

import { useState } from "react";

type Provider = "buttondown" | "beehiiv" | null;

export function NewsletterForm({
  provider,
  action,
  idPrefix = "newsletter",
}: {
  provider: Provider;
  action: string | null;
  idPrefix?: string;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const emailId = `${idPrefix}-email`;
  const connected = Boolean(provider && action);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (connected) return;
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setMessage(
      "Nothing was stored. The list is not connected yet. When Beehiiv or Buttondown is configured, this same form will subscribe you.",
    );
    setEmail("");
  }

  return (
    <form
      onSubmit={onSubmit}
      action={connected ? action ?? undefined : undefined}
      method={connected ? "post" : undefined}
      target={connected ? "_blank" : undefined}
      className="mt-4"
      noValidate={false}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={emailId} className="sr-only">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={connected ? undefined : email}
            onChange={connected ? undefined : (event) => setEmail(event.target.value)}
            aria-describedby={`${idPrefix}-note`}
            className="h-12 w-full border border-line bg-bg px-3 text-text placeholder:text-muted/70"
          />
        </div>
        {provider === "buttondown" ? (
          <input type="hidden" name="embed" value="1" />
        ) : null}
        <button
          type="submit"
          className="btn-gold h-12 shrink-0 px-5 font-semibold"
        >
          Subscribe
        </button>
      </div>
      <p id={`${idPrefix}-note`} className="mt-3 text-sm leading-relaxed text-muted">
        No subscriber count shown until real. Unsubscribe anytime.
        {connected
          ? ` This form posts to ${provider === "beehiiv" ? "Beehiiv" : "Buttondown"}.`
          : " Signup is a placeholder until a provider is connected."}
      </p>
      {message ? (
        <p role="status" className="mt-3 text-sm text-gold">
          {message}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";

const ADVERTISE_EMAIL = "advertise@pickmyagent.ai";

export function AdvertiseForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const body = useMemo(
    () =>
      [
        `Name: ${name}`,
        `Company: ${company}`,
        `Email: ${email}`,
        `Tool URL: ${toolUrl}`,
        "",
        message,
      ].join("\n"),
    [name, company, email, toolUrl, message],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const href = `mailto:${ADVERTISE_EMAIL}?subject=${encodeURIComponent(
      `Advertise with PickMyAgent: ${company || name}`,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = href;
    setStatus(
      "Your email app should open a message to advertise@pickmyagent.ai. This page does not take payment or store the form.",
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="ad-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="ad-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="ad-company" className="block text-sm font-medium">
          Company
        </label>
        <input
          id="ad-company"
          name="company"
          required
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="ad-email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="ad-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="ad-tool-url" className="block text-sm font-medium">
          Tool URL
        </label>
        <input
          id="ad-tool-url"
          name="toolUrl"
          type="url"
          required
          placeholder="https://"
          value={toolUrl}
          onChange={(event) => setToolUrl(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="ad-message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="ad-message"
          name="message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="mt-1 w-full border border-line bg-bg px-3 py-2"
        />
      </div>
      <button type="submit" className="btn-gold h-12 px-5 font-semibold">
        Email your interest
      </button>
      <p className="text-sm text-muted">
        Or write to{" "}
        <a className="text-gold underline" href={`mailto:${ADVERTISE_EMAIL}`}>
          {ADVERTISE_EMAIL}
        </a>
        . No payment is collected here.
      </p>
      {status ? <p className="text-sm">{status}</p> : null}
    </form>
  );
}

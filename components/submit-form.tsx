"use client";

import { useMemo, useState } from "react";

const USE_CASES = [
  "Build multi-agent workflows",
  "Code with an AI agent",
  "Give agents tools and browsers",
  "Automate business workflows",
  "Research and retrieve the web",
  "Game NPCs and in-game agents",
  "Create for games and streams",
  "Meetings, notes and knowledge",
  "Something else",
];

export function SubmitForm({ submitEmail }: { submitEmail: string | null }) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [useCase, setUseCase] = useState(USE_CASES[0]);
  const [email, setEmail] = useState("");
  const [blurb, setBlurb] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const body = useMemo(() => {
    return [
      `Tool: ${name}`,
      `Website: ${website}`,
      `Use case: ${useCase}`,
      `Contact: ${email}`,
      "",
      blurb,
    ].join("\n");
  }, [name, website, useCase, email, blurb]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    if (submitEmail) {
      const href = `mailto:${submitEmail}?subject=${encodeURIComponent(
        `Tool submission: ${name}`,
      )}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
      setStatus("Your email app should open with this submission. Nothing was stored on PickMyAgent.");
      return;
    }
    try {
      await navigator.clipboard.writeText(body);
      setStatus(
        "Nothing was sent or stored. The submission text is on your clipboard. Set SUBMIT email in the deploy environment when you want this form to open a mailbox.",
      );
    } catch {
      setStatus(
        "Nothing was sent or stored. Copy the summary below and send it when a public inbox is connected.",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <div>
        <label htmlFor="tool-name" className="block text-sm font-medium">
          Tool name
        </label>
        <input
          id="tool-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="tool-url" className="block text-sm font-medium">
          Website
        </label>
        <input
          id="tool-url"
          name="website"
          type="url"
          required
          placeholder="https://"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="tool-usecase" className="block text-sm font-medium">
          Use case
        </label>
        <select
          id="tool-usecase"
          name="useCase"
          value={useCase}
          onChange={(event) => setUseCase(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        >
          {USE_CASES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="tool-email" className="block text-sm font-medium">
          Your email
        </label>
        <input
          id="tool-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 h-12 w-full border border-line bg-bg px-3"
        />
      </div>
      <div>
        <label htmlFor="tool-blurb" className="block text-sm font-medium">
          What should we know?
        </label>
        <textarea
          id="tool-blurb"
          name="blurb"
          required
          rows={5}
          value={blurb}
          onChange={(event) => setBlurb(event.target.value)}
          className="mt-1 w-full border border-line bg-bg px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="h-12 bg-lime px-5 font-semibold text-lime-ink hover:bg-white"
      >
        {submitEmail ? "Email this submission" : "Copy submission"}
      </button>
      <p className="text-sm leading-relaxed text-muted">
        Free editorial review while we grow the catalog. Nothing is
        auto-published. Fast-track and featured options come later — prices are
        not set, so they are not listed here.
      </p>
      {status ? (
        <p role="status" className="text-sm text-lime">
          {status}
        </p>
      ) : null}
      {!submitEmail && (name || website || blurb) ? (
        <pre className="overflow-x-auto border border-line bg-bg p-3 text-xs leading-relaxed text-muted">
          {body}
        </pre>
      ) : null}
    </form>
  );
}

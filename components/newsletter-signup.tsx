import { getNewsletterFormUrl } from "@/lib/newsletter";

export function NewsletterSignup({
  idPrefix,
  className,
  heading,
  description,
  compact = false,
}: {
  idPrefix: string;
  className?: string;
  heading?: string;
  description?: string;
  compact?: boolean;
}) {
  const action = getNewsletterFormUrl();
  const emailId = `${idPrefix}-email`;
  const copy = description ?? "Get the best new AI tools every week. Free.";

  return (
    <form
      action={action}
      method="get"
      target="_blank"
      className={className}
    >
      {heading ? (
        <h3 className="text-lg font-semibold tracking-tight text-text">{heading}</h3>
      ) : null}
      <p
        className={
          heading || description
            ? "mt-1 text-sm leading-relaxed text-muted"
            : "text-base leading-relaxed"
        }
      >
        {copy}
      </p>
      <div className={`${compact ? "mt-3" : "mt-4"} flex flex-col gap-3 sm:flex-row`}>
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
          className="h-12 min-w-0 flex-1 border border-line bg-bg px-3 text-text placeholder:text-muted/70"
        />
        <button
          type="submit"
          className="btn-gold h-12 shrink-0 px-5 font-semibold"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="mb-8 max-w-3xl">
      <p className="font-mono text-xs tracking-[0.18em] text-lime uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {lede ? (
        <p className="mt-3 text-lg leading-relaxed text-muted">{lede}</p>
      ) : null}
    </header>
  );
}

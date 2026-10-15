import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <p className="font-mono text-xs tracking-[0.18em] text-gold uppercase">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        That page is not in the catalog.
      </h1>
      <p className="mt-3 text-muted">
        The link may be old, or the tool was never listed.
      </p>
      <div className="mt-6 flex gap-4">
        <Link href="/" className="font-semibold text-gold hover:underline">
          Home
        </Link>
        <Link href="/tools" className="font-semibold text-gold hover:underline">
          All tools
        </Link>
      </div>
    </div>
  );
}

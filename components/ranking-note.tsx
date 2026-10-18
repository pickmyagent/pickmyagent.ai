import Link from "next/link";

export function RankingNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-sm leading-relaxed text-muted ${className}`.trim()}>
      Some links may be affiliate links. They never affect rankings.{" "}
      <Link href="/how-we-rank" className="text-gold hover:underline">
        How we rank
      </Link>
    </p>
  );
}

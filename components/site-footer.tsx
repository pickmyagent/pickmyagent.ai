import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { RobotMark } from "@/components/robot-mark";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-we-rank", label: "How we rank" },
  { href: "/advertise", label: "Advertise with us" },
  { href: "/community", label: "Community" },
  { href: "/categories", label: "Categories" },
  { href: "/how-we-test", label: "How we test" },
  { href: "/new", label: "New this week" },
  { href: "/submit", label: "Submit a tool" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/llms.txt", label: "llms.txt" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-semibold text-gold">
              <RobotMark className="h-6 w-6 shrink-0" />
              PickMyAgent
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              PickMyAgent is an independent directory. We may use affiliate
              links later; if we do, we’ll disclose them. Paid placements will
              be marked.
            </p>
            <NewsletterSignup idPrefix="footer-newsletter" className="mt-6 max-w-xl" />
          </div>
          <p className="font-mono text-xs text-muted">pickmyagent.ai</p>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-muted hover:text-text">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/use-cases", label: "Use cases" },
  { href: "/tools", label: "Tools" },
  { href: "/new", label: "New" },
  { href: "/how-we-test", label: "How we test" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center border border-lime font-mono text-sm text-lime"
          >
            P
          </span>
          <span>PickMyAgent</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={active ? "text-lime" : "text-muted hover:text-text"}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/submit"
            className="bg-lime px-3 py-2 text-sm font-semibold text-lime-ink hover:bg-white"
          >
            Submit a tool
          </Link>
        </nav>
        <button
          type="button"
          className="border border-line px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpenPath(open ? null : pathname)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-bg px-4 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block px-2 py-3 text-muted hover:text-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/submit" className="block px-2 py-3 font-semibold text-lime">
                Submit a tool
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

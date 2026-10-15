import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSite } from "@/lib/catalog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = getSite();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "PickMyAgent — Find the AI agent that fits the job",
    template: "%s · PickMyAgent",
  },
  description:
    "Tell us the job and PickMyAgent recommends a few AI tools that fit, plus what is new this week. Independent directory. No invented ratings.",
  applicationName: "PickMyAgent",
  openGraph: {
    type: "website",
    siteName: "PickMyAgent",
    locale: "en_US",
    title: "PickMyAgent — Find the AI agent that fits the job",
    description:
      "A use-case-first directory of AI tools and agents. A short list that fits, plus what is new this week.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PickMyAgent — Find the AI agent that fits the job",
    description:
      "A use-case-first directory of AI tools and agents. A short list that fits, plus what is new this week.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLM-readable site index"
        />
      </head>
      <body className="flex min-h-full flex-col">
        <a href="#content" className="skip-link btn-gold">
          Skip to content
        </a>
        <SiteHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}

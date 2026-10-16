# PickMyAgent

Use-case-first directory of AI tools and agents. Tell us the job and the site recommends a short list that fits, plus what was new in the latest catalog check.

The catalog is JSON in this repo. There is no database.

## Develop

```bash
npm install
npm run dev
```

`npm run dev` and `npm run build` assemble `content/catalog.json` from the files in `content/` before starting Next.js.

## Add a tool

1. Copy `content/tools/crewai.json` to `content/tools/your-slug.json`.
2. Set a unique `id` and `slug`. Keep `shortDescription` to 160 characters or fewer.
3. Set `useCaseTags` to one or more of:
   - `multi-agent-workflows`
   - `coding-agents`
   - `tool-use-browser`
   - `workflow-automation`
   - `research-rag`
   - `game-npcs`
   - `game-creative`
   - `creator-video-audio`
   - `meetings-knowledge`
4. Put category slugs from `content/categories.json` in `categories`.
5. Fill `bestFor`, `notIdealFor`, `strength`, `weakness`, `pricingNotes`, and `freeTier` only from sources you actually opened. `strength` and `weakness` are one sentence each, from the official docs, the pricing page, or the hands-on note. Use `freeTier: null` when a free tier is unconfirmed. `startingPrice` is the lowest paid plan in USD per month, `freeTrial` is the length written on the official pricing page, and `pricingCheckedAt` is the date that page was fetched. Leave each of those null when it was not on the page. Do not invent prices, ratings, testimonials, or user counts.
6. Set the check fields together:
   - `smokeStatus: "tested-hands-on"` only after a local install or import with no account, no payment, and no model call. Then set `smokeTested: true`, `handsOn.performed: true`, and `checkedDate` (`YYYY-MM-DD`).
   - `smokeStatus: "verified-docs-only"` when the official site and docs or pricing pages were read, but there was no successful local hello-path. Set `smokeTested: false`. The site shows **Docs checked**.
   - `smokeStatus: "untested"` when verification did not finish (for example a homepage HTTP 403). Set `smokeTested: false`. The site shows **Not fully checked** and will not place the tool on a use-case short list.
7. Leave `featured` and `featuredPaid` false unless a placement is real. If `featuredPaid` is true, `featured` must be true. The UI labels that case **Featured (paid)**.
8. Leave `affiliateUrl` null until the disclosure line on the tool page is acceptable for that link.
9. To put the tool on a short list, add `{ "toolId", "why" }` to `content/use-cases/<slug>.json`. Short lists are 2–5 tools. Untested tools cannot be recommended. Otherwise the tool still appears under “Also in this use case” when a tag matches.
10. Run `npm run catalog` (or `npm run build`). The assembler rejects a smoke-tested flag that does not match `tested-hands-on`.

Do not re-run `npm run seed` unless you mean to regenerate the original October 15, 2026 seed from `content/source/smoke-tests.json`. That script overwrites `content/tools` and `content/use-cases`.

## Badges

| Label | When |
| --- | --- |
| Smoke-tested | `smokeStatus` is `tested-hands-on` and `smokeTested` is true |
| Docs checked | `verified-docs-only` |
| Not fully checked | `untested` |
| Open source | `openSource` is true |
| New release | A logged public release on or after the `recentReleaseSince` date in `content/site.json` |
| Featured (paid) | `featured` and `featuredPaid` |

## Deploy on Vercel

The app is Next.js App Router with no custom server. Import the repository in Vercel and leave the framework preset on Next.js. The build command is `npm run build`.

Optional environment variables, all public because the forms run in the browser:

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_BUTTONDOWN_USERNAME` | Newsletter form posts to that Buttondown username |
| `NEXT_PUBLIC_BEEHIIV_EMBED_URL` | Used when Buttondown is unset. Newsletter form posts the `email` field to this URL |
| `NEXT_PUBLIC_SUBMIT_EMAIL` | Submit form opens a `mailto:` draft to this address |

Until those are set, the newsletter form does not store the address, and the submit form copies the text to the clipboard. Nothing is auto-published.

Point `pickmyagent.ai` at the Vercel project after the domain is registered. Canonical URLs already use `https://pickmyagent.ai`.

## Checks

```bash
npm run lint
npm run build
```

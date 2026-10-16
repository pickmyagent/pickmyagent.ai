# Community board setup

The board at `/community` stays on **Coming soon**, and the Community nav link stays hidden, until both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and the site is rebuilt.

Use the Supabase **Free** plan only. Do not turn on paid compute, extra disk, image storage, or a custom SMTP add-on. Google and Discord login are free.

## 1. Create the Supabase project

1. Sign in at [https://supabase.com](https://supabase.com) and choose **New project**.
2. Pick the Free plan and a region close to your visitors.
3. Save the database password somewhere private. The app does not need that password.
4. Wait until the project status is healthy.

## 2. Run the SQL

1. In the Supabase dashboard, open **SQL Editor** → **New query**.
2. Paste the full file `supabase/migrations/20261016120000_community_board.sql` and run it.
3. Open a new query, paste `supabase/seed.sql`, and run it.

The migration creates categories, profiles, threads, replies, reports, row-level security, the sign-up profile trigger, and the post rules (signed-in only, 5 posts per 10 minutes, length limits, one link for accounts newer than 7 days).

The seed adds five starter threads from **PickMyAgent team**. They are questions for members. They are not posts written by fake users, and they have no fake replies.

Running either file again is safe: categories and starter rows use `on conflict do nothing`.

## 3. Turn on Google login

1. In [Google Cloud Console](https://console.cloud.google.com/), create a project (or use an existing one).
2. **APIs & Services** → **OAuth consent screen**. Choose External, add the app name PickMyAgent, and add your email as a test user while the app is in testing.
3. **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID** → **Web application**.
4. Under **Authorized redirect URIs**, add the Supabase callback, not the website URL:

   `https://<project-ref>.supabase.co/auth/v1/callback`

   `<project-ref>` is the id in your Supabase URL (`https://<project-ref>.supabase.co`).

5. Copy the client ID and client secret.
6. In Supabase, open **Authentication** → **Sign In / Providers** → **Google**. Enable it and paste the client ID and secret.

## 4. Turn on Discord login

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**. Name it PickMyAgent.
2. Open **OAuth2**. Copy the client ID and client secret.
3. Add this redirect (the same Supabase callback):

   `https://<project-ref>.supabase.co/auth/v1/callback`

4. In Supabase, open **Authentication** → **Sign In / Providers** → **Discord**. Enable it, paste the client ID and secret, and leave the email scope on so the account has an email address.

## 5. Allow the site to finish login

In Supabase, open **Authentication** → **URL configuration**.

- **Site URL:** `https://www.pickmyagent.ai`
- **Redirect URLs:** add both of these, one per line:

  `https://www.pickmyagent.ai/auth/callback`

  `http://localhost:3000/auth/callback`

The live site sends people back to `https://www.pickmyagent.ai/auth/callback`. The localhost URL is only for trying the board on your machine.

## 6. Add the Vercel environment variables

In the Vercel project, open **Settings** → **Environment Variables**. Add these for Production (and Preview if you want the board on preview URLs):

| Name | Where to copy it | Public? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase **Project Settings** → **Data API** → Project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → `anon` `public` key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` secret | No. Server only. This key bypasses row-level security. |
| `ADMIN_EMAILS` | Your Google or Discord account email. Separate extra admins with commas. | No. Server only. |

Redeploy after saving. `NEXT_PUBLIC_*` values are baked in at build time, so a restart without a new build will not show the board.

## 7. Check it

1. Open `https://www.pickmyagent.ai/community`. The five starter threads should be listed with author **PickMyAgent team**, zero replies, and a last-activity date.
2. Community should appear in the nav.
3. Signed out, the reply box is replaced by Google and Discord buttons.
4. Sign in, post a reply, and confirm a sixth post inside 10 minutes is refused.
5. With your email in `ADMIN_EMAILS`, open a thread and use **Hide post**. The thread or reply leaves the public board.

Local check: put the same four variables in `.env.local`, run `npm run dev`, and open `http://localhost:3000/community`.

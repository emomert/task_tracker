# 07 — Setup & Deployment Guide

Written for a non-expert. Follow top to bottom. Everything here is free.

## A. Install the tools (one time)

### 1. Node.js
The app's build tools need Node.js. Install the **LTS** version (20 or newer) from nodejs.org. Verify in a terminal:
```
node --version
```

### 2. Claude Code
Two ways — pick one:

- **Native installer (recommended, no Node needed for Claude Code itself):**
  - macOS / Linux / WSL: `curl -fsSL https://claude.ai/install.sh | bash`
  - Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`
- **Or via npm** (requires Node.js 18+, which you installed above): `npm install -g @anthropic-ai/claude-code`

Claude Code needs a paid Anthropic account (Claude Pro/Max, Team, Enterprise, or API credits). Verify:
```
claude --version
```
Official docs: https://code.claude.com/docs/en/setup

### 3. A code editor (optional)
VS Code is handy for looking at files, but Claude Code runs in the terminal.

## B. Create your free Supabase project (one time)

1. Sign up at supabase.com and create a new project. Pick a region near your team. Save the database password it gives you.
2. Open the project → **Settings → API**. Copy two values:
   - **Project URL** → this is `VITE_SUPABASE_URL`.
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`. (This key is safe to put in the app; do **not** copy the `service_role` key.)
3. Open **SQL Editor → New query**, paste the SQL from `docs/03-data-model.md`, and run it. This creates your tables, security rules, and the sign-up trigger.

## C. Build the app with Claude Code

1. Put this whole spec folder somewhere on your computer.
2. Open a terminal in that folder and run `claude`.
3. Tell it: *"Read CLAUDE.md and everything in docs/. Use Stack A. Start with Phase 0 of docs/06-build-plan.md and stop after each phase so I can test."*
4. When asked, give it the two Supabase values (or paste them into the `.env` file it creates).
5. Run the app locally when prompted:
   ```
   npm install
   npm run dev
   ```
   Open the local URL it prints (usually http://localhost:5173).

Work phase by phase. Test each phase against its "Definition of done" before moving on.

## D. Deploy so your team can use it

Recommended host: **Cloudflare Pages** (free, allows business use). Netlify works the same way if you prefer.

1. Push your finished app to a GitHub repo (Claude Code can do this for you).
2. In Cloudflare Pages → **Create application → Connect to Git** → pick the repo.
3. Build settings: build command `npm run build`, output directory `dist` (Vite's default).
4. Add **environment variables** in Cloudflare: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as local).
5. Add a **SPA fallback** so deep links work: a `_redirects` file containing `/*  /index.html  200` (Claude Code should add this), or the equivalent in Cloudflare's settings.
6. Deploy. You'll get a URL like `your-app.pages.dev`.
7. In **Supabase → Authentication → URL Configuration**, add your deployed URL to the allowed **Site URL / redirect URLs** so login works in production.

## E. Get your team in (no email needed)

Because v1 has no email invites, onboarding is simple:
1. Share the deployed URL with your 3–4 teammates.
2. Each person opens it once and **signs up** with their work email + a password they choose.
3. Once signed up, they appear on the **People** page and can be assigned tasks. Anyone can edit a person's name/role/emoji.

That's it — no admin account-creation step in v1.

## F. Good to know

- **The free Supabase project pauses after ~1 week of zero use.** A team using it during the week keeps it awake; if it ever pauses (e.g. over a long holiday), open the Supabase dashboard and click resume (~30 seconds). Your data is safe across a pause.
- **You own everything.** The code is in your GitHub repo; the data is in your Supabase database. If any free tier ever changes, you can export and move — nothing is locked to a vendor.
- **Keep the anon key; protect the service_role key.** The anon key is in the app by design (RLS protects your data). The `service_role` key should never appear in the app or the repo.
- **Costs:** $0/month to run. The only spend is your Anthropic subscription to use Claude Code while building, plus your time.

## G. If something goes wrong

- Login works locally but not after deploy → you probably forgot step D7 (add the deployed URL to Supabase Auth URLs) or the env vars in the host.
- "Project paused" errors → resume it in the Supabase dashboard (section F).
- Build fails on the host → confirm build command `npm run build` and output dir `dist`, and that both env vars are set in the host.
- Anything else → paste the error into Claude Code and ask it to fix; it has all of these docs for context.

# Getting started with Task Tracker

This is the built app (React + Vite + Supabase). The planning docs live alongside it
(`01-overview.md` … `07-setup-and-deploy.md`). Follow the steps below to run it locally and
deploy it for free.

## 1. Create your Supabase project (one time)

1. Sign up at [supabase.com](https://supabase.com) and create a project (pick a region near your team).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql),
   and **Run**. This creates the tables, security rules (RLS), and the sign-up trigger.
3. Because Task Tracker sends **no email**, turn off email confirmation so sign-up logs people in
   immediately: **Authentication → Providers → Email →** uncheck **Confirm email** → Save.
4. Open **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
     (Never use the `service_role` key in this app.)

## 2. Run it locally

```bash
npm install
cp .env.example .env      # then paste your two values into .env
npm run dev               # open the printed URL (usually http://localhost:5173)
```

Open the URL, **sign up** with your email + a password, and you're in. Each teammate signs up
the same way; they then appear on the **People** page and can be assigned tasks.

> The `.env` file is git-ignored. Restart `npm run dev` after editing it.

## 3. Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload. |
| `npm run build` | Type-check and build the static site into `dist/`. |
| `npm run preview` | Serve the built `dist/` locally to sanity-check the production build. |
| `npm run typecheck` | Type-check only. |

## 4. Deploy for free (Cloudflare Pages or Netlify)

Both allow commercial use on their free tier. Vite outputs a plain static site in `dist/`.

1. Push this repo to GitHub.
2. **Cloudflare Pages → Create application → Connect to Git** (or Netlify → Add new site → Import).
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in the host: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (the same values as your local `.env`).
5. Deep links work out of the box — `public/_redirects` (`/*  /index.html  200`) ships an SPA
   fallback to `dist/`.
6. After the first deploy, add your live URL in **Supabase → Authentication → URL Configuration**
   (Site URL / Redirect URLs) so login works in production.

## 5. Good to know

- **$0/month to run.** A free Supabase project pauses after ~1 week of zero activity; open the
  dashboard and click resume (~30s) if that ever happens. Your data is safe across a pause.
- **You own everything** — the code (your repo) and the data (your Supabase database).
- **Markdown is the source of truth.** The project canvas and task bodies are stored as Markdown
  in the database; the editor is just a convenience layer.

## Architecture at a glance

```
src/
  auth/          Session provider (Supabase Auth)
  components/
    editor/      BlockNote Markdown editor + autosave
    layout/      App shell, sidebar, route guards
    tasks/       Board (dnd-kit), table, task detail, pickers
    ui/          Small reusable primitives (Modal, Avatar, icons, …)
  hooks/         Debounce, autosave, localStorage, project-tasks data
  lib/
    api/         Thin data layer over Supabase (projects, tasks, profiles)
    supabase.ts  The single shared client (anon key only)
  pages/         Login, Signup, Settings, People, Project, Home
  types.ts       The shared data-model types
supabase/schema.sql   Run this in the Supabase SQL editor
```

# Task Tracker

A minimal, Notion-style work tracker for a small team — projects in a collapsible sidebar, a
Markdown writing canvas, and tasks you assign to people, shown as a drag-and-drop **board** or a
**table**. Free to run and entirely yours: your code, your database.

> **Live site:** _Deploying on Netlify — URL coming soon._
> _(Once deployed, replace this with your `https://<your-site>.netlify.app` link.)_

---

## Features

- **Email + password accounts** (Supabase Auth) — self-service sign-up, persisted sessions.
- **Projects** with emoji + name: create, rename, re-emoji, delete, drag to reorder.
- **Board (Kanban)** — drag cards between Not started / In progress / Done; reorder within a column.
- **Table** — sortable columns; edit status, priority, and assignees inline.
- **Tasks** — status, priority, assignees, due date, and a per-task **Markdown document**.
- **Project notes canvas** — a calm, book-like Markdown editor (BlockNote).
- **People** directory — edit anyone's name, role, and emoji.
- **Markdown is the source of truth**, with gentle debounced autosave.

## Tech stack

React 18 + TypeScript + Vite · Tailwind CSS · Supabase (Postgres + Auth + Row Level Security) ·
BlockNote (Markdown editor) · dnd-kit (Kanban) · React Router · TanStack Query. The app is a static
SPA that talks to Supabase directly with the public anon key — no server to run.

## Quick start (local)

```bash
npm install
cp .env.example .env     # then fill in your two Supabase values
npm run dev              # http://localhost:5173
```

You need a free Supabase project first (create it, run `supabase/schema.sql`, copy your URL + anon
key). The full click-by-click is in **[GETTING-STARTED.md](GETTING-STARTED.md)**.

### Creating an account

Account creation is **self-service email + password** — open the app, click **Create an account**,
and sign up. Whether new users are logged in instantly or must confirm by email depends on one
Supabase setting:

- **Confirm email OFF** (recommended for this no-email setup): sign-up logs you straight in.
- **Confirm email ON**: Supabase emails a confirmation link; click it, then sign in.

Toggle it under **Supabase → Authentication → Providers → Email → Confirm email**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check + build the static site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run typecheck` | Type-check only |

## Deploy (Netlify)

This repo includes `netlify.toml`, so Netlify auto-detects the build.

1. **app.netlify.com → Add new site → Import an existing project → GitHub** → pick this repo.
2. Build settings come from `netlify.toml` (build `npm run build`, publish `dist`).
3. Add environment variables **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`**, then deploy.
   Vite bakes env vars in at build time — after adding/changing them, trigger a redeploy.
4. Add your live URL in **Supabase → Authentication → URL Configuration** (Site URL + Redirect URLs).

Every push to `main` auto-rebuilds and redeploys.

## Project structure

```
src/
  auth/          Session provider (Supabase Auth)
  components/
    editor/      BlockNote Markdown editor + autosave
    layout/      App shell, sidebar, route guards
    tasks/       Board (dnd-kit), table, task detail, pickers
    ui/          Reusable primitives (Modal, Avatar, Toast, icons, …)
  hooks/         Debounce, autosave, focus-trap, project-tasks data
  lib/api/       Thin data layer over Supabase (projects, tasks, profiles)
  pages/         Login, Signup, Settings, People, Project, Home
supabase/schema.sql   Run this once in the Supabase SQL editor
```

## Planning docs

The original design/spec documents live alongside the code:

| File | About |
|---|---|
| [01-overview.md](01-overview.md) | Vision, audience, scope |
| [02-features.md](02-features.md) | Features + acceptance criteria |
| [03-data-model.md](03-data-model.md) | Schema + RLS SQL |
| [04-design.md](04-design.md) | Look, feel, design tokens |
| [05-tech-stack.md](05-tech-stack.md) | Stack rationale + alternatives |
| [06-build-plan.md](06-build-plan.md) | Phased build plan |
| [07-setup-and-deploy.md](07-setup-and-deploy.md) | Setup & deployment |
| [GETTING-STARTED.md](GETTING-STARTED.md) | Run & deploy this app |

Free to run on free tiers; $0/month. You own the code (this repo) and the data (your Supabase
project).

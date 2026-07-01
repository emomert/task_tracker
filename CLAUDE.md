# CLAUDE.md — Agent Operating Manual

You are building **Task Tracker** (the app shipped under this name; "WorkTrack" was the original placeholder and may still appear in a few internal notes), a minimal Notion-style work-tracking web app for a small team. This file is your contract. Read it fully, then read the numbered docs (`01`–`07`, which live at the **repo root**, not in a `docs/` folder), then begin **Phase 0** in `06-build-plan.md`.

## What this product is, in one paragraph

A web app where a small team (3–4 people) manages work. A collapsible left sidebar lists **projects** (each with an emoji and a name). Selecting a project opens its page on the right: a Markdown **canvas** for notes plus its **tasks**. Tasks have a status (Not Started / In Progress / Done), one or more **assignees**, a **due date**, a **priority**, and their own **Markdown document**. Tasks can be shown as a drag-and-drop **board** or a **table**. Every team member logs in with their own email and password. There are **no email notifications** in v1.

## The stack you must use (unless the user tells you otherwise)

- **React 18 + TypeScript**, built with **Vite** (a static single-page app — no custom backend server).
- **Tailwind CSS** for styling.
- **Supabase** for the database (Postgres), authentication (email + password), and data access. Row Level Security (RLS) enforces access. The frontend talks to Supabase directly via `@supabase/supabase-js`.
- **BlockNote** (`@blocknote/react`, `@blocknote/core`) for the Notion-style block editor. It must import/export **Markdown** — store Markdown in the database, not BlockNote's internal JSON.
- **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`) for the Kanban drag-and-drop.
- **React Router** (`react-router-dom`) for routing.
- **TanStack Query** (`@tanstack/react-query`) for fetching/caching Supabase data.

Full justification and two alternative stacks are in `05-tech-stack.md`. Architecture details are there too.

## Hard rules

1. **Markdown is the source of truth** for all rich text (project canvas and task bodies). The editor is a convenience layer; what gets saved is Markdown. This keeps content portable and easy to work with later.
2. **Never expose the Supabase `service_role` key** in the frontend. The app uses only the public **anon key**, which is safe to ship because RLS protects the data. All secrets go in environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), never hardcoded.
3. **No paid services and no email service.** Everything must run on free tiers. Do not add Resend/SendGrid/Twilio/etc.
4. **Keep it simple.** This is for 4 people. Do not add real-time collaboration, complex permission tiers, workspaces-within-workspaces, or anything not in `02-features.md`. When in doubt, choose the simpler implementation.
5. **Build in the phases** defined in `06-build-plan.md`. Finish and verify one phase before starting the next. Each phase has a "Definition of done."
6. **Match the design** in `04-design.md` — minimal, calm, Notion-like. Use the provided design tokens. Maintain a quality floor: responsive to mobile, visible keyboard focus, sensible empty/loading/error states.
7. **Write UI copy from the user's side of the screen** (plain verbs, sentence case, action labels that say what happens). See the writing notes in `04-design.md`.

## Conventions

- TypeScript everywhere; avoid `any`. Define types for the data model (Project, Task, Profile, etc.) in one place and reuse them.
- Components small and focused; colocate component-specific styles/logic.
- Centralize the Supabase client in a single module (e.g. `src/lib/supabase.ts`).
- Centralize all DB reads/writes in a thin data layer (e.g. `src/lib/api/` with `projects.ts`, `tasks.ts`, `profiles.ts`) so UI components don't write raw queries inline.
- Use environment variables via Vite's `import.meta.env`. Provide a `.env.example` documenting required vars.
- Commit after each working phase with a clear message.

## What "done" means for v1

A logged-in user can: sign up / log in; create, rename, reorder, and delete projects (with emoji); write Markdown notes on a project canvas; create tasks with title, status, priority, due date, and assignees; see tasks as a board (and drag to change status) or a table; open a task and edit its Markdown document; and manage people (name, role, emoji). Everything is deployed to a free host and reachable by URL for the whole team.

Anything beyond that list is out of scope for v1 — note it as a future idea rather than building it.

# 06 — Build Plan

Build in phases. Finish and verify one before starting the next; each has a **Definition of done (DoD)**. Commit after each phase. This assumes Stack A (see `05-tech-stack.md`).

---

## Phase 0 — Project setup
**Goal:** a running empty app wired to Supabase.

- Scaffold a Vite + React + TypeScript app.
- Add Tailwind CSS and the design tokens from `04-design.md` (as CSS variables + Tailwind theme).
- Install dependencies: `@supabase/supabase-js`, `@blocknote/react`, `@blocknote/core`, `@dnd-kit/core`, `@dnd-kit/sortable`, `react-router-dom`, `@tanstack/react-query`.
- Create a Supabase project; run the SQL from `supabase/schema.sql` (the single source of truth; `03-data-model.md` is explanatory only).
- Add `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and a committed `.env.example`.
- Centralize the client in `src/lib/supabase.ts`. Set up the data layer folders `src/lib/api/` and shared types in `src/types.ts`.

**DoD:** `npm run dev` serves a blank app; a test query to Supabase succeeds; env vars load.

---

## Phase 1 — Authentication
**Goal:** real accounts.

- Sign-up (email, password, full name) and log-in pages using Supabase Auth.
- Pass `full_name` as user metadata so the sign-up trigger fills the profile.
- Session context/provider; protected routes (redirect logged-out users to log in).
- Log out. A Settings page to edit own name/role/emoji and change password.

**DoD:** I can sign up, log out, log back in, stay logged in across refresh, and edit my profile. A new sign-up creates a `profiles` row.

---

## Phase 2 — App shell & sidebar
**Goal:** the layout and project list.

- Collapsible sidebar (expanded ~240px / collapsed ~56px), main area, per `04-design.md`.
- List projects from the DB (ordered by `sort_order`).
- Create project (name + emoji picker), rename, change emoji, delete (with confirm), and drag-reorder (persist `sort_order`).
- Sidebar links to People and Settings. Empty state when no projects.

**DoD:** I can create/rename/re-emoji/reorder/delete projects and collapse the sidebar; all changes persist across refresh.

---

## Phase 3 — Project page & Markdown canvas
**Goal:** open a project and write notes.

- Route per project (`/project/:id`); header shows emoji + editable name and the view toggle (Table / Board / Calendar / Notes; table default).
- Integrate BlockNote for the project's `description_md`: load Markdown → editor, edit, **serialize back to Markdown**, autosave (debounced) with a "Saving…/Saved" indicator.

**DoD:** I can open a project, write headings/lists/checkboxes/a table, and the content saves as Markdown and reloads correctly.

---

## Phase 4 — People
**Goal:** the team directory.

- People page listing all `profiles` (emoji, name, email read-only, role).
- Edit name, role, emoji for any person.
- A reusable assignee-picker component (multi-select of people) for use by tasks.

**DoD:** everyone who signed up appears; I can edit their display fields; the assignee picker lists them.

---

## Phase 5 — Tasks data & table view
**Goal:** create and manage tasks; see them in a table.

- Task data layer: create (quick-add by title), read by project, update fields, delete; manage `task_assignees`.
- Table view: columns title, status, assignees, due date, priority, updated; sortable headers (due date, priority, status, updated); inline edit of status/priority/assignees; row click opens task detail (Phase 7).

**DoD:** I can create a task with just a title, fill in all fields, sort the table, and change status inline; everything persists.

---

## Phase 6 — Board (Kanban) view
**Goal:** the default drag-and-drop view.

- Three columns (Not Started / In Progress / Done) with counts and status dots.
- Cards show title, assignee chips, due date (red if overdue), priority marker.
- dnd-kit: drag between columns → update `status`; reorder within a column → update `sort_order`.
- "+ Add task" per column. View toggle wired between Table / Board / Calendar / Notes (**Table is the default** on first open).

**DoD:** the board is reachable from the view toggle; dragging a card changes its status and persists; within-column order persists.

---

## Phase 7 — Task detail & Markdown document
**Goal:** open a task and edit its full document.

- Side panel / modal / route (keep it fast and simple).
- BlockNote editor for the task `body_md` (Markdown in/out, autosave), plus editable status, assignees, due date, priority, and created/updated display. Delete from here too.

**DoD:** I can open a task, edit its body and fields, close, and see everything persisted.

---

## Phase 8 — Polish
**Goal:** make it feel calm and finished.

- Apply the full design spec: spacing, type, status/priority colors, empty/loading/error states, overdue styling.
- Responsive: sidebar → drawer on mobile; board scrolls/stacks. Keyboard focus visible. `prefers-reduced-motion` respected.
- Friendly empty-state copy from `04-design.md`.

**DoD:** the app matches the design spec, works on a phone, and has no blank flashes or dead-ends.

---

## Phase 9 — Deploy
**Goal:** live and reachable by the team.

- Build the static site; deploy to Cloudflare Pages (or Netlify). Set env vars in the host. Configure SPA fallback (all routes → `index.html`).
- Confirm Supabase auth works from the deployed URL (add the deployed URL to Supabase Auth's allowed redirect/site URLs).
- Test with two accounts on two devices.

**DoD:** the team can open the URL, sign up, and use Task Tracker together. See `07-setup-and-deploy.md` for the click-by-click.

---

## Suggested order of risk-reduction

If you want to de-risk early, get Phases 0–1 (setup + auth) and a single end-to-end slice (create a project → add one task → see it on the board) working before polishing. Everything else builds on that spine.

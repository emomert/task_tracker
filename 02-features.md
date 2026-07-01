# 02 — Feature Specification

Each feature below is written as a requirement plus acceptance criteria (what must be true for it to count as done). Build these to satisfy the criteria; don't add behavior beyond them in v1.

---

## 1. Accounts & authentication

Every team member has their own account and signs in with email + password (handled by Supabase Auth).

**Requirements**
- A sign-up page (email + password + full name) and a log-in page.
- Sessions persist across refreshes; a logged-out user visiting any app route is sent to log in.
- A "log out" action.
- On sign-up, a matching **profile** record is created automatically (see `03-data-model.md`).
- A simple profile/settings area where a user can edit their own **name**, **role**, and **emoji/avatar**, and change their password.

**Onboarding without email (important):** Because there are no emails in v1, onboarding is self-service. Each teammate opens the app URL once and signs up. Share the URL with the team; that's the whole onboarding flow. (An "admin creates accounts" option is described in `05-tech-stack.md` as a future enhancement — do not build it in v1.)

**Acceptance criteria**
- I can sign up, log out, and log back in.
- Refreshing the page keeps me logged in.
- An unauthenticated user cannot reach project/task pages.
- A new sign-up appears as a person in the People area.

---

## 2. App shell: collapsible sidebar + canvas

The core layout is a left **sidebar** (projects + navigation) and a right **canvas** (the active project or page).

**Requirements**
- Left sidebar lists all projects (emoji + name), plus links to **People** and **Settings**.
- The sidebar **collapses/expands** (a toggle). Collapsed state persists for the session.
- The right area fills remaining width and shows whatever is selected.
- A clear empty state when there are no projects yet ("Create your first project").

**Acceptance criteria**
- I can collapse and expand the sidebar.
- Clicking a project opens it on the right.
- With zero projects, I see an inviting empty state with a create action.

---

## 3. Projects

Projects are the top-level containers (e.g. *VNDP*, *WordPunk*).

**Requirements**
- Create a project with a **name** and an **emoji** (emoji picker; default 📁).
- **Rename** a project and **change its emoji**.
- **Reorder** projects in the sidebar (drag to reorder, persisted via a sort order).
- **Delete** a project (with a confirm step). Deleting a project deletes its tasks.
- Each project has a **Markdown canvas** (notes about the project) — see Feature 6.

**Acceptance criteria**
- I can create, rename, re-emoji, reorder, and delete projects, and the changes persist across refresh.
- Deleting a project removes its tasks too.

---

## 4. People

A directory of the team. Anyone can add or edit people.

**Requirements**
- A **People** page listing everyone: emoji/avatar, name, email, role.
- Add/edit a person's **name**, **role** (free text, e.g. "Designer", "PM"), and **emoji**. Email is set at sign-up and shown read-only.
- People are the pool of possible **task assignees**.

> v1 note: a "person" is the same as a user account (created by signing up). The People page edits the profile fields of existing accounts. It does not create logins (no email invites in v1).

**Acceptance criteria**
- Everyone who has signed up appears on the People page.
- I can edit a person's name, role, and emoji, and it persists.
- People appear as options when assigning a task.

---

## 5. Tasks

Tasks live inside a project and are the unit of work.

**Fields**
- **Title** (required, short text).
- **Status**: Not Started · In Progress · Done.
- **Assignees**: zero or more people.
- **Due date**: optional date.
- **Priority**: optional — Low · Medium · High.
- **Created / updated** timestamps (set automatically).
- **Body**: a per-task **Markdown document** (the place to write what needs doing) — see Feature 6.

**Requirements**
- Create a task in a project (quick-add: just a title is enough; other fields optional).
- Edit any field.
- Delete a task (with confirm).
- Change status from either the board or the table.

**Acceptance criteria**
- I can create a task with only a title, then fill in status, assignees, due date, and priority.
- All fields persist across refresh.
- Created/updated timestamps populate automatically.

---

## 6. The Markdown editor (Notion-style)

A block-based WYSIWYG editor (BlockNote) used in two places: the **project canvas** and each **task's body**. It looks formatted as you type, but stores **Markdown**.

**Requirements**
- Supports: headings, paragraphs, bold/italic/code, bullet and numbered lists, **to-do checklists** (clickable checkboxes), **tables**, quotes, dividers, and code blocks.
- A slash ("/") menu to insert blocks, Notion-style.
- Content is **saved as Markdown** to the database and **loaded from Markdown** back into the editor.
- **Autosave** (debounced, e.g. ~1s after typing stops) with a subtle "saving…/saved" indicator. No data loss on navigation.

**Acceptance criteria**
- I can write headings, checklists, and a table; tick a checkbox.
- What's stored in the database is Markdown (verifiable in Supabase).
- My edits autosave and survive a refresh and re-open.

---

## 7. Board view (Kanban)

A drag-and-drop way to see a project's tasks. (The **table** view, Feature 8, is what opens by default — see the note there.)

**Requirements**
- Three columns: **Not Started**, **In Progress**, **Done**.
- Each task is a card showing title, assignee emoji(s)/initials, due date, and a priority indicator.
- **Drag a card** between columns to change its status; **reorder** cards within a column (persisted via sort order).
- A "+ Add task" affordance at the top/bottom of a column.
- Clicking a card opens the task detail (Feature 8).

**Acceptance criteria**
- I can switch to the board from the view toggle.
- Dragging a card to another column changes its status and persists.
- Card order within a column persists.

---

## 8. Table view

An alternative list view, toggled from the board.

**Requirements**
- A **view toggle** (Table / Board / Calendar / Notes) on the project page; **table is the default** whenever you open a project.
- Columns: title, status, assignees, due date, priority, updated.
- **Sort** by clicking column headers (at least by due date, priority, status, updated).
- Inline editing of status, priority, and assignees from the row (or a row click that opens the task detail).

**Acceptance criteria**
- I can switch to Board and back; Table stays the default on first open.
- I can sort by due date and by status.
- I can change a task's status from the table.

---

## 9. Task detail

Opening a task shows its full document and metadata.

**Requirements**
- Opens as a side panel, modal, or dedicated route (implementer's choice; keep it simple and fast).
- Shows the editable Markdown **body** plus all fields (status, assignees, due date, priority, created/updated).
- Delete from here as well.

**Acceptance criteria**
- I can open a task, edit its body and fields, and close — changes persist.

---

## 10. Persistence & access

- All data is stored in Supabase Postgres and protected by Row Level Security.
- The app is a static site; it reads/writes the database directly using the public anon key.
- Access is team-based: a project belongs to one team, and you can read/edit it (and its tasks) only if you're on that team — or if it has no team (visible to everyone). An admin role manages teams and people. See `03-data-model.md` for the exact RLS policies.

**Acceptance criteria**
- Two different logged-in users see the same projects/tasks; a change by one is visible to the other after refresh.
- A logged-out request cannot read or write data.

# 03 — Data Model

The database is Supabase Postgres. Below are the tables, their relationships, and ready-to-run SQL (schema + Row Level Security + the trigger that creates a profile on sign-up).

## Entities at a glance

- **profiles** — one row per user account. Holds app-level person info (name, role, emoji). Linked 1:1 to Supabase's built-in `auth.users`.
- **projects** — top-level containers shown in the sidebar.
- **tasks** — work items inside a project.
- **task_assignees** — join table linking tasks to the people assigned to them (many-to-many).

```
auth.users (Supabase) ──1:1── profiles ──┐
                                          ├──< task_assignees >── tasks >── projects
                                          │
profiles 1───< projects (created_by)
profiles 1───< tasks (created_by)
projects 1───< tasks
```

## Field reference

### profiles
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (PK) | Equals `auth.users.id`. |
| `email` | text | Copied from auth at sign-up; shown read-only. |
| `full_name` | text | Editable. |
| `role` | text | Free text job/role, e.g. "Designer". Nullable. |
| `emoji` | text | Avatar emoji, default '🙂'. |
| `created_at` | timestamptz | Default now(). |

### projects
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (PK) | Default gen_random_uuid(). |
| `name` | text | Required. |
| `emoji` | text | Default '📁'. |
| `description_md` | text | The project's Markdown canvas. Nullable. |
| `sort_order` | double precision | For sidebar ordering. |
| `created_by` | uuid (FK→profiles.id) | Who made it. |
| `created_at` | timestamptz | Default now(). |
| `updated_at` | timestamptz | Maintained by trigger. |

### tasks
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (PK) | Default gen_random_uuid(). |
| `project_id` | uuid (FK→projects.id) | ON DELETE CASCADE. |
| `title` | text | Required. |
| `status` | text | One of `not_started`, `in_progress`, `done`. Default `not_started`. |
| `priority` | text | One of `low`, `medium`, `high`, or NULL. |
| `due_date` | date | Nullable. |
| `body_md` | text | The task's Markdown document. Nullable. |
| `sort_order` | double precision | Order within its board column. |
| `created_by` | uuid (FK→profiles.id) | |
| `created_at` | timestamptz | Default now(). |
| `updated_at` | timestamptz | Maintained by trigger. |

### task_assignees
| Field | Type | Notes |
|-------|------|-------|
| `task_id` | uuid (FK→tasks.id) | ON DELETE CASCADE. |
| `profile_id` | uuid (FK→profiles.id) | ON DELETE CASCADE. |
| `assigned_at` | timestamptz | Default now(). |
| — | PRIMARY KEY (`task_id`, `profile_id`) | Prevents duplicates. |

> **Status & priority** are stored as text with CHECK constraints (simpler to evolve than Postgres enums). `sort_order` is a float so cards can be reordered by inserting a value between two neighbors without renumbering everything.

## Access model (RLS)

This is a trusted team. Policy: **any authenticated user can read and write all rows**, except that a profile's `id`/`email` shouldn't be reassigned. Logged-out users get nothing. This is intentional for v1 — see `05-tech-stack.md` for how to tighten it later.

## Ready-to-run SQL

Run this in the Supabase SQL editor (Dashboard → SQL → New query). It is idempotent-ish for a fresh project.

```sql
-- ========== Extensions ==========
create extension if not exists "pgcrypto";

-- ========== Tables ==========
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  role        text,
  emoji       text default '🙂',
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  emoji          text not null default '📁',
  description_md text,
  sort_order     double precision not null default 0,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  status      text not null default 'not_started'
              check (status in ('not_started','in_progress','done')),
  priority    text check (priority in ('low','medium','high')),
  due_date    date,
  body_md     text,
  sort_order  double precision not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.task_assignees (
  task_id     uuid not null references public.tasks(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists task_assignees_profile_idx on public.task_assignees(profile_id);

-- ========== updated_at trigger ==========
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ========== Auto-create profile on sign-up ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== Row Level Security ==========
alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.tasks          enable row level security;
alter table public.task_assignees enable row level security;

-- Any logged-in user can read everything.
create policy "read profiles"        on public.profiles       for select to authenticated using (true);
create policy "read projects"        on public.projects       for select to authenticated using (true);
create policy "read tasks"           on public.tasks          for select to authenticated using (true);
create policy "read task_assignees"  on public.task_assignees for select to authenticated using (true);

-- Any logged-in user can edit projects, tasks, and assignments.
create policy "write projects"       on public.projects       for all to authenticated using (true) with check (true);
create policy "write tasks"          on public.tasks          for all to authenticated using (true) with check (true);
create policy "write task_assignees" on public.task_assignees for all to authenticated using (true) with check (true);

-- Profiles: anyone logged in can update people's display fields; inserts handled by the trigger.
create policy "update profiles"      on public.profiles       for update to authenticated using (true) with check (true);
```

## Notes for the implementer

- When the app needs the "list of people," read `profiles`.
- To set a task's assignees, replace its rows in `task_assignees` (delete then insert, or upsert) inside one logical operation.
- The `description_md` (project canvas) and `body_md` (task doc) columns hold Markdown strings produced by the editor's Markdown serializer.
- If you later want an "admin can create accounts" flow, that requires the `service_role` key and **must** live in a Supabase Edge Function (never the browser). Out of scope for v1.

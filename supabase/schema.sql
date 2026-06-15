-- ============================================================
-- WorkTrack — database schema, RLS, and sign-up trigger.
-- Run this once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Mirrors 03-data-model.md. Safe to run on a fresh project.
-- ============================================================

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
drop policy if exists "read profiles"       on public.profiles;
drop policy if exists "read projects"       on public.projects;
drop policy if exists "read tasks"          on public.tasks;
drop policy if exists "read task_assignees" on public.task_assignees;
create policy "read profiles"        on public.profiles       for select to authenticated using (true);
create policy "read projects"        on public.projects       for select to authenticated using (true);
create policy "read tasks"           on public.tasks          for select to authenticated using (true);
create policy "read task_assignees"  on public.task_assignees for select to authenticated using (true);

-- Any logged-in user can edit projects, tasks, and assignments.
drop policy if exists "write projects"       on public.projects;
drop policy if exists "write tasks"          on public.tasks;
drop policy if exists "write task_assignees" on public.task_assignees;
create policy "write projects"       on public.projects       for all to authenticated using (true) with check (true);
create policy "write tasks"          on public.tasks          for all to authenticated using (true) with check (true);
create policy "write task_assignees" on public.task_assignees for all to authenticated using (true) with check (true);

-- Profiles: anyone logged in can update people's display fields; inserts handled by the trigger.
drop policy if exists "update profiles" on public.profiles;
create policy "update profiles"      on public.profiles       for update to authenticated using (true) with check (true);

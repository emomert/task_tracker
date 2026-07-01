-- ============================================================
-- Task Tracker — database schema, RLS, triggers, and sign-up trigger.
-- THIS FILE IS THE SINGLE SOURCE OF TRUTH for the database.
-- Run it once in your Supabase project:
--   Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to run on a fresh project (idempotent-ish: "if not exists" / "or replace").
-- (03-data-model.md is an explanatory summary only; when they differ, this wins.
--  Incremental changes since the initial setup live in supabase/migrations/.)
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
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  emoji          text not null default '📁',
  color          text not null default 'neutral',
  is_archived    boolean not null default false,
  brief          text,
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
returns trigger language plpgsql set search_path = '' as $$
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
returns trigger language plpgsql security definer set search_path = '' as $$
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

-- Harden: this function only ever runs as the sign-up trigger above. Postgres grants
-- EXECUTE to PUBLIC by default, which would also expose it as a REST RPC
-- (/rest/v1/rpc/handle_new_user). Revoke that — the trigger still fires regardless.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

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

-- ========== Admin role ==========
-- Admin status lives in profiles.is_admin. Authorization helper goes in a private
-- (non-API-exposed) schema so it can't be called as a REST RPC.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Block non-admins from changing anyone's admin flag (including their own). A
-- direct / no-JWT context (auth.uid() is null: migrations, service role) is trusted.
create or replace function public.guard_profile_admin()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not private.is_admin() then
    raise exception 'Only admins can change admin status';
  end if;
  -- Never allow removing the last remaining admin — that would lock team + admin
  -- management out of the app entirely (recovery would need raw SQL).
  if old.is_admin and not new.is_admin
     and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'Cannot remove the last admin';
  end if;
  return new;
end $$;
revoke all on function public.guard_profile_admin() from public;

drop trigger if exists profiles_guard_admin on public.profiles;
create trigger profiles_guard_admin before update on public.profiles
  for each row execute function public.guard_profile_admin();

-- Profiles: you can update your own row; admins can update anyone's. The trigger
-- above still prevents non-admins from flipping the is_admin flag.
drop policy if exists "update profiles" on public.profiles;
drop policy if exists "update own or admin profile" on public.profiles;
create policy "update own or admin profile" on public.profiles for update to authenticated
  using ( id = (select auth.uid()) or private.is_admin() )
  with check ( id = (select auth.uid()) or private.is_admin() );

-- Bootstrap the first admin once, then manage the rest from the People page:
--   update public.profiles set is_admin = true where email = 'you@example.com';

-- ============================================================
-- Teams (feature batch 2) — access-control grouping.
-- A person can be on many teams; a project belongs to one team.
-- You can see a project only if you're a member of its team (or an admin).
-- Projects with a NULL team are visible to everyone (treated as unassigned).
-- ============================================================
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id    uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, profile_id)
);

alter table public.projects add column if not exists team_id uuid references public.teams(id) on delete set null;
create index if not exists projects_team_id_idx on public.projects(team_id);
create index if not exists team_members_profile_idx on public.team_members(profile_id);

-- Access helpers (private schema, not exposed via the REST API).
create or replace function private.is_team_member(team uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.team_members tm where tm.team_id = team and tm.profile_id = auth.uid())
$$;
revoke all on function private.is_team_member(uuid) from public;
grant execute on function private.is_team_member(uuid) to authenticated;

create or replace function private.can_access_project(pid uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select coalesce((
    select p.team_id is null or private.is_team_member(p.team_id)
    from public.projects p where p.id = pid
  ), false)
$$;
revoke all on function private.can_access_project(uuid) from public;
grant execute on function private.can_access_project(uuid) to authenticated;

create or replace function private.can_access_task(tid uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select coalesce((select private.can_access_project(t.project_id) from public.tasks t where t.id = tid), false)
$$;
revoke all on function private.can_access_task(uuid) from public;
grant execute on function private.can_access_task(uuid) to authenticated;

alter table public.teams        enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "read teams" on public.teams;
create policy "read teams" on public.teams for select to authenticated using (true);
drop policy if exists "admins manage teams" on public.teams;
create policy "admins manage teams" on public.teams for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists "read team_members" on public.team_members;
create policy "read team_members" on public.team_members for select to authenticated using (true);
drop policy if exists "join or admin team_members" on public.team_members;
create policy "join or admin team_members" on public.team_members for all to authenticated
  using (profile_id = (select auth.uid()) or private.is_admin())
  with check (profile_id = (select auth.uid()) or private.is_admin());

-- Re-gate projects / tasks / task_assignees by team access (replaces the
-- permissive "everyone can read/write" policies above).
drop policy if exists "read projects" on public.projects;
drop policy if exists "write projects" on public.projects;
drop policy if exists "read accessible projects" on public.projects;
drop policy if exists "write accessible projects" on public.projects;
create policy "read accessible projects" on public.projects for select to authenticated
  using (team_id is null or private.is_team_member(team_id));
create policy "write accessible projects" on public.projects for all to authenticated
  using (team_id is null or private.is_team_member(team_id))
  with check (team_id is null or private.is_team_member(team_id));

drop policy if exists "read tasks" on public.tasks;
drop policy if exists "write tasks" on public.tasks;
drop policy if exists "read accessible tasks" on public.tasks;
drop policy if exists "write accessible tasks" on public.tasks;
create policy "read accessible tasks" on public.tasks for select to authenticated
  using (private.can_access_project(project_id));
create policy "write accessible tasks" on public.tasks for all to authenticated
  using (private.can_access_project(project_id)) with check (private.can_access_project(project_id));

drop policy if exists "read task_assignees" on public.task_assignees;
drop policy if exists "write task_assignees" on public.task_assignees;
drop policy if exists "read accessible task_assignees" on public.task_assignees;
drop policy if exists "write accessible task_assignees" on public.task_assignees;
create policy "read accessible task_assignees" on public.task_assignees for select to authenticated
  using (private.can_access_task(task_id));
create policy "write accessible task_assignees" on public.task_assignees for all to authenticated
  using (private.can_access_task(task_id)) with check (private.can_access_task(task_id));

-- One-time migration (only needed on an existing project): put everyone in a
-- 'General' team and assign team-less projects to it, so nothing disappears.
--   insert into public.teams (name) select 'General'
--     where not exists (select 1 from public.teams where name = 'General');
--   insert into public.team_members (team_id, profile_id)
--     select t.id, p.id from public.teams t cross join public.profiles p
--     where t.name = 'General' on conflict do nothing;
--   update public.projects set team_id = (select id from public.teams where name='General' limit 1)
--     where team_id is null;

-- ============================================================
-- Pin created_by to the authenticated user on insert (anti-spoofing).
-- Placed last so projects / tasks / teams all exist. Direct / no-JWT contexts
-- (auth.uid() is null: migrations, service role) are trusted and left as-is.
-- ============================================================
create or replace function public.pin_created_by()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.created_by := auth.uid();
  end if;
  return new;
end $$;
revoke all on function public.pin_created_by() from public;

drop trigger if exists projects_pin_created_by on public.projects;
create trigger projects_pin_created_by before insert on public.projects
  for each row execute function public.pin_created_by();

drop trigger if exists tasks_pin_created_by on public.tasks;
create trigger tasks_pin_created_by before insert on public.tasks
  for each row execute function public.pin_created_by();

drop trigger if exists teams_pin_created_by on public.teams;
create trigger teams_pin_created_by before insert on public.teams
  for each row execute function public.pin_created_by();

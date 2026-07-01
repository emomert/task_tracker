-- ============================================================
-- Audit remediation: hardening + cleanup (2026-07-01).
-- Additive and idempotent. Does NOT modify any existing row data.
-- Applied to project qgxpmkyqemmifrqgxswr on 2026-07-01.
-- The from-scratch schema in supabase/schema.sql already includes all of this;
-- this file is the incremental change for databases provisioned before today.
-- ============================================================

-- 1) Pin created_by to the authenticated user on insert, so authorship cannot be
--    spoofed by a crafted client insert. Direct / no-JWT contexts (auth.uid() is
--    null: migrations, service role) are trusted and left untouched.
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

-- 2) Never allow removing the last remaining admin (would lock team + admin
--    management out of the app; recovery would need raw SQL). Extends the
--    existing admin-flag guard; keeps its non-admin protection intact.
create or replace function public.guard_profile_admin()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_admin is distinct from old.is_admin
     and auth.uid() is not null
     and not private.is_admin() then
    raise exception 'Only admins can change admin status';
  end if;
  if old.is_admin and not new.is_admin
     and (select count(*) from public.profiles where is_admin) <= 1 then
    raise exception 'Cannot remove the last admin';
  end if;
  return new;
end $$;
revoke all on function public.guard_profile_admin() from public;

-- 3) Harden handle_new_user to search_path='' for consistency with the other
--    SECURITY DEFINER functions (all its references are already schema-qualified).
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
end $$;
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 4) Drop the dead comments + subtasks tables (comments feature removed; subtasks
--    never shipped to the frontend). Both verified empty (0 rows). cascade only
--    removes their own indexes/policies — nothing references them.
drop table if exists public.comments cascade;
drop table if exists public.subtasks cascade;

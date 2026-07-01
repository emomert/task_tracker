# 03 — Data Model

The database is Supabase Postgres. This file explains the tables and their relationships.

> **The single source of truth for the schema is [`supabase/schema.sql`](supabase/schema.sql).** Run that file (paste it into the Supabase SQL editor) to provision or update a database — it includes everything below plus the team-based Row Level Security, the admin role, and the sign-up trigger. The field tables here are a human-readable summary and may lag the SQL; when they disagree, `schema.sql` wins.

## Entities at a glance

- **profiles** — one row per user account. Holds app-level person info (name, role, emoji) and an `is_admin` flag. Linked 1:1 to Supabase's built-in `auth.users`.
- **projects** — top-level containers shown in the sidebar. Each belongs to one team (or none).
- **tasks** — work items inside a project.
- **task_assignees** — join table linking tasks to the people assigned to them (many-to-many).
- **teams** — access-control groups. A person can be on many teams; a project belongs to one team.
- **team_members** — join table linking people to the teams they're on.

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
| `emoji` | text | Avatar emoji, default '🙂'. Nullable in the DB; the app falls back to a default when empty. |
| `is_admin` | boolean | Admin role. Manages Teams and grants admin to others. Default false; guarded so only admins can change it. |
| `created_at` | timestamptz | Default now(). |

### projects
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (PK) | Default gen_random_uuid(). |
| `name` | text | Required. |
| `emoji` | text | Default '📁'. |
| `color` | text | Palette key for the sidebar color bar. Default 'neutral'. |
| `is_archived` | boolean | Archived projects move to a collapsed sidebar section. Default false. |
| `brief` | text | Short blurb shown in the project side panel. Nullable. |
| `team_id` | uuid (FK→teams.id) | The team that can see this project. NULL = visible to everyone. |
| `description_md` | text | The project's Markdown canvas. Nullable. |
| `sort_order` | double precision | For sidebar ordering. |
| `created_by` | uuid (FK→profiles.id) | Who made it. Pinned to the creator server-side. |
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

### teams
| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid (PK) | Default gen_random_uuid(). |
| `name` | text | Required. |
| `created_by` | uuid (FK→profiles.id) | Nullable. |
| `created_at` | timestamptz | Default now(). |

### team_members
| Field | Type | Notes |
|-------|------|-------|
| `team_id` | uuid (FK→teams.id) | ON DELETE CASCADE. |
| `profile_id` | uuid (FK→profiles.id) | ON DELETE CASCADE. |
| — | PRIMARY KEY (`team_id`, `profile_id`) | Prevents duplicates. |

> **Status & priority** are stored as text with CHECK constraints (simpler to evolve than Postgres enums). `sort_order` is a float so cards can be reordered by inserting a value between two neighbors without renumbering everything.

## Access model (RLS)

Access is **team-based**, enforced entirely by Row Level Security (the frontend uses the public anon key, so RLS is the only real boundary):

- A **project belongs to one team** (`projects.team_id`). You can read and write a project — and, by extension, its tasks, task documents, and assignees — only if you are a member of that team. A project with a **NULL `team_id` is visible to everyone** (treated as unassigned/shared).
- **Team membership is self-service:** any signed-in user can join or leave teams themselves (there is a Join/Leave control on the Teams page). Teams are therefore an organizational filter, not a hard secrecy wall — treat them as "who needs to see this," not "who is forbidden."
- The **admin role** (`profiles.is_admin`) can create/rename/delete teams and grant admin to others. A DB trigger prevents non-admins from changing any `is_admin` flag, and prevents removing the **last** remaining admin (which would lock team management out of the app).
- **profiles**: everyone can read all profiles (the People directory); you can update your own row, and admins can update anyone's. `created_by` on projects/tasks/teams is pinned to the creator server-side, so it can't be spoofed.
- Logged-out requests get nothing.

Helper functions used by the policies live in a non-API-exposed `private` schema (`is_admin`, `is_team_member`, `can_access_project`, `can_access_task`). See `supabase/schema.sql` for the exact policies.

## Notes for the implementer

- When the app needs the "list of people," read `profiles`.
- To set a task's assignees, replace its rows in `task_assignees` (delete then insert, or upsert) inside one logical operation.
- The `description_md` (project canvas) and `body_md` (task doc) columns hold Markdown strings produced by the editor's Markdown serializer.
- If you later want an "admin can create accounts" flow, that requires the `service_role` key and **must** live in a Supabase Edge Function (never the browser). Out of scope for v1.

// ============================================================
// Central data-model types. Mirrors the schema in 03-data-model.md.
// Define here once, reuse everywhere. Avoid `any`.
// ============================================================

export type TaskStatus = 'not_started' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  /** Nullable in the DB (the column has a default, not NOT NULL); consumers
   *  fall back to a default emoji when it's null/empty. */
  emoji: string | null
  is_admin: boolean
  created_at: string
}

export interface Team {
  id: string
  name: string
  created_by: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  emoji: string
  /** A palette key (see PROJECT_COLORS in constants). */
  color: string
  is_archived: boolean
  /** The team this project belongs to (null = visible to everyone). */
  team_id: string | null
  /** A short blurb shown in the project side panel. */
  brief: string | null
  description_md: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: TaskPriority | null
  /** ISO date string, 'YYYY-MM-DD'. */
  due_date: string | null
  body_md: string | null
  sort_order: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskAssignee {
  task_id: string
  profile_id: string
  assigned_at: string
}

/** A task plus its resolved assignee profiles (the shape the UI works with). */
export interface TaskWithAssignees extends Task {
  assignees: Profile[]
}

/** A task plus its project — the shape the personal "My Work" dashboard works with. */
export interface MyTask extends TaskWithAssignees {
  project: { id: string; name: string; emoji: string }
}

// ---------- Write payloads ----------

export interface NewProject {
  name: string
  emoji?: string
  color?: string
  team_id?: string | null
  brief?: string | null
  sort_order?: number
  created_by?: string | null
}

export type ProjectPatch = Partial<
  Pick<
    Project,
    | 'name'
    | 'emoji'
    | 'color'
    | 'is_archived'
    | 'team_id'
    | 'brief'
    | 'description_md'
    | 'sort_order'
  >
>

export interface NewTask {
  project_id: string
  title: string
  status?: TaskStatus
  priority?: TaskPriority | null
  due_date?: string | null
  sort_order?: number
  created_by?: string | null
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'status' | 'priority' | 'due_date' | 'body_md' | 'sort_order'>
>

export type ProfilePatch = Partial<Pick<Profile, 'full_name' | 'role' | 'emoji'>>

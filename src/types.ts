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
  emoji: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  emoji: string
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

// ---------- Write payloads ----------

export interface NewProject {
  name: string
  emoji?: string
  sort_order?: number
  created_by?: string | null
}

export type ProjectPatch = Partial<
  Pick<Project, 'name' | 'emoji' | 'description_md' | 'sort_order'>
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

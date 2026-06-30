import { supabase } from '../supabase'
import { sortKeyAfterMax } from '../sort'
import type {
  MyTask,
  NewTask,
  Profile,
  Task,
  TaskPatch,
  TaskStatus,
  TaskWithAssignees,
} from '../../types'

// Shape returned by the nested select below, before we flatten it.
interface TaskRowWithJoin extends Task {
  task_assignees: Array<{ profile: Profile | null }> | null
}

const SELECT_WITH_ASSIGNEES = '*, task_assignees(profile:profiles(*))'

function flatten(row: TaskRowWithJoin): TaskWithAssignees {
  const { task_assignees, ...task } = row
  const assignees = (task_assignees ?? [])
    .map((ta) => ta.profile)
    .filter((p): p is Profile => p != null)
  return { ...task, assignees }
}

/** All tasks in a project, each with its resolved assignees. */
export async function listTasksByProject(projectId: string): Promise<TaskWithAssignees[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT_WITH_ASSIGNEES)
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as unknown as TaskRowWithJoin[]).map(flatten)
}

export async function getTask(id: string): Promise<TaskWithAssignees | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(SELECT_WITH_ASSIGNEES)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return flatten(data as unknown as TaskRowWithJoin)
}

interface MyTaskRow {
  task:
    | (Task & {
        project: { id: string; name: string; emoji: string } | null
        assignees: Array<{ profile: Profile | null }> | null
      })
    | null
}

/** Every task the given person is assigned to, across all projects (for the dashboard). */
export async function listMyTasks(profileId: string): Promise<MyTask[]> {
  const { data, error } = await supabase
    .from('task_assignees')
    .select(
      'task:tasks!inner(*, project:projects(id, name, emoji), assignees:task_assignees(profile:profiles(*)))',
    )
    .eq('profile_id', profileId)

  if (error) throw error

  return ((data ?? []) as unknown as MyTaskRow[])
    .map((r) => r.task)
    .filter((t): t is NonNullable<MyTaskRow['task']> => t != null && t.project != null)
    .map((t) => {
      const { assignees, project, ...task } = t
      return {
        ...task,
        project: project as { id: string; name: string; emoji: string },
        assignees: (assignees ?? [])
          .map((a) => a.profile)
          .filter((p): p is Profile => p != null),
      }
    })
}

export interface SearchTask {
  id: string
  title: string
  status: TaskStatus
  project: { id: string; name: string; emoji: string }
}

interface AllTaskRow {
  id: string
  title: string
  status: TaskStatus
  project: { id: string; name: string; emoji: string } | null
}

/** Every accessible task with its project — for the command palette / search. */
export async function listAllTasks(): Promise<SearchTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, project:projects(id, name, emoji)')
    .order('updated_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return ((data ?? []) as unknown as AllTaskRow[])
    .filter((r): r is SearchTask => r.project != null)
    .map((r) => ({ id: r.id, title: r.title, status: r.status, project: r.project! }))
}

async function maxTaskSortOrder(projectId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? (data as { sort_order: number }).sort_order : null
}

/** Quick-add supports title-only; other fields optional. */
export async function createTask(input: NewTask): Promise<Task> {
  const sort_order =
    input.sort_order ?? sortKeyAfterMax(await maxTaskSortOrder(input.project_id))
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: input.project_id,
      title: input.title,
      status: input.status ?? 'not_started',
      priority: input.priority ?? null,
      due_date: input.due_date ?? null,
      sort_order,
      created_by: auth.user?.id ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}

/**
 * Set a task's assignees by applying a minimal diff (add new, then remove gone).
 * Adding before removing means a failed write never leaves the task with zero
 * assignees. (See 03-data-model.md "Notes for the implementer".)
 */
export async function setAssignees(taskId: string, profileIds: string[]): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from('task_assignees')
    .select('profile_id')
    .eq('task_id', taskId)
  if (readError) throw readError

  const currentIds = new Set(
    (current ?? []).map((r) => (r as { profile_id: string }).profile_id),
  )
  const nextIds = new Set(profileIds)

  const toAdd = profileIds.filter((id) => !currentIds.has(id))
  const toRemove = [...currentIds].filter((id) => !nextIds.has(id))

  if (toAdd.length > 0) {
    const rows = toAdd.map((profile_id) => ({ task_id: taskId, profile_id }))
    const { error } = await supabase.from('task_assignees').insert(rows)
    if (error) throw error
  }

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('task_assignees')
      .delete()
      .eq('task_id', taskId)
      .in('profile_id', toRemove)
    if (error) throw error
  }
}

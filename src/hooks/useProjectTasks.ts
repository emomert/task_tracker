import { useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/queryClient'
import {
  createTask,
  deleteTask,
  listTasksByProject,
  setAssignees,
  updateTask,
} from '../lib/api/tasks'
import { useToast } from '../components/ui/Toast'
import type { Profile, TaskPatch, TaskStatus, TaskWithAssignees } from '../types'

const SAVE_ERROR = "Couldn't save your change. Check your connection and try again."

/**
 * Loads a project's tasks and exposes mutating actions that update the cache
 * optimistically (snappy board/table) before reconciling with the server.
 */
export function useProjectTasks(projectId: string) {
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const key = qk.tasks(projectId)

  const query = useQuery({
    queryKey: key,
    queryFn: () => listTasksByProject(projectId),
  })

  function setLocal(
    updater: (prev: TaskWithAssignees[]) => TaskWithAssignees[],
  ): void {
    queryClient.setQueryData<TaskWithAssignees[]>(key, (prev) => updater(prev ?? []))
  }

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: key })
    // The "My Work" dashboard (qk.myTasks) and the command-palette search
    // (qk.allTasks) are derived views keyed independently of the project list —
    // ['tasks', projectId] does NOT prefix-match ['my-tasks', …] or ['all-tasks'].
    // Refresh them too so a task added/edited/moved/deleted here doesn't linger as
    // a stale (or dangling, already-deleted) entry there for up to staleTime.
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
    queryClient.invalidateQueries({ queryKey: qk.allTasks })
  }

  /**
   * Run an optimistic mutation: apply `optimistic` to the cache immediately, then
   * the server `write`. On failure, restore the exact pre-mutation snapshot (so a
   * failed change — even when the reconciling refetch also fails offline — doesn't
   * keep showing as if it saved), toast, and reconcile.
   */
  async function optimistic(
    optimistic: (prev: TaskWithAssignees[]) => TaskWithAssignees[],
    write: () => Promise<void>,
    errorMsg: string,
  ): Promise<void> {
    const snapshot = queryClient.getQueryData<TaskWithAssignees[]>(key)
    setLocal(optimistic)
    try {
      await write()
    } catch (err) {
      console.error(err)
      if (snapshot) queryClient.setQueryData(key, snapshot)
      notify(errorMsg, 'error')
    } finally {
      invalidate()
    }
  }

  async function create(input: {
    title: string
    status?: TaskStatus
    sort_order?: number
  }): Promise<void> {
    try {
      const task = await createTask({ project_id: projectId, ...input })
      setLocal((prev) => [...prev, { ...task, assignees: [] }])
      invalidate()
    } catch (err) {
      console.error(err)
      notify("Couldn't add the task. Check your connection and try again.", 'error')
      throw err // let the quick-add keep the typed title for retry
    }
  }

  async function patch(id: string, fields: TaskPatch): Promise<void> {
    await optimistic(
      (prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)),
      () => updateTask(id, fields).then(() => undefined),
      SAVE_ERROR,
    )
  }

  /**
   * Save a task's Markdown body. Unlike `patch`, this REJECTS on failure (it
   * does not swallow the error), so the editor's autosave surfaces an error and
   * retries instead of falsely reporting "Saved" and dropping the edit.
   *
   * It deliberately does NOT call invalidate(): the body isn't shown in any list
   * view, so refetching the whole (body-heavy) project task list on every ~1s
   * autosave pause is pure waste. We reconcile just this row from the server
   * response instead.
   */
  async function saveBody(id: string, body_md: string): Promise<void> {
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, body_md } : t)))
    const updated = await updateTask(id, { body_md })
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)))
  }

  async function assign(id: string, people: Profile[]): Promise<void> {
    await optimistic(
      (prev) => prev.map((t) => (t.id === id ? { ...t, assignees: people } : t)),
      () => setAssignees(id, people.map((p) => p.id)),
      SAVE_ERROR,
    )
  }

  async function remove(id: string): Promise<void> {
    await optimistic(
      (prev) => prev.filter((t) => t.id !== id),
      () => deleteTask(id),
      "Couldn't delete the task. Check your connection and try again.",
    )
  }

  /** Persist a board move: new status + new fractional sort_order. */
  async function move(id: string, status: TaskStatus, sortOrder: number): Promise<void> {
    await optimistic(
      (prev) => prev.map((t) => (t.id === id ? { ...t, status, sort_order: sortOrder } : t)),
      () => updateTask(id, { status, sort_order: sortOrder }).then(() => undefined),
      "Couldn't move the task. Check your connection and try again.",
    )
  }

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    create,
    patch,
    saveBody,
    assign,
    remove,
    move,
  }
}

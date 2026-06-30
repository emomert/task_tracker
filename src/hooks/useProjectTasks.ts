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
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields } : t)))
    try {
      await updateTask(id, fields)
    } catch (err) {
      console.error(err)
      notify(SAVE_ERROR, 'error')
    } finally {
      invalidate()
    }
  }

  /**
   * Save a task's Markdown body. Unlike `patch`, this REJECTS on failure (it
   * does not swallow the error), so the editor's autosave surfaces an error and
   * retries instead of falsely reporting "Saved" and dropping the edit.
   */
  async function saveBody(id: string, body_md: string): Promise<void> {
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, body_md } : t)))
    await updateTask(id, { body_md })
    invalidate()
  }

  async function assign(id: string, people: Profile[]): Promise<void> {
    setLocal((prev) => prev.map((t) => (t.id === id ? { ...t, assignees: people } : t)))
    try {
      await setAssignees(
        id,
        people.map((p) => p.id),
      )
    } catch (err) {
      console.error(err)
      notify(SAVE_ERROR, 'error')
    } finally {
      invalidate()
    }
  }

  async function remove(id: string): Promise<void> {
    setLocal((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch (err) {
      console.error(err)
      notify("Couldn't delete the task. Check your connection and try again.", 'error')
    } finally {
      invalidate()
    }
  }

  /** Persist a board move: new status + new fractional sort_order. */
  async function move(id: string, status: TaskStatus, sortOrder: number): Promise<void> {
    setLocal((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, sort_order: sortOrder } : t)),
    )
    try {
      await updateTask(id, { status, sort_order: sortOrder })
    } catch (err) {
      console.error(err)
      notify("Couldn't move the task. Check your connection and try again.", 'error')
    } finally {
      invalidate()
    }
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

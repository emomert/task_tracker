import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../../lib/queryClient'
import {
  createSubtask,
  deleteSubtask,
  listSubtasks,
  updateSubtask,
} from '../../lib/api/subtasks'
import { PlusIcon, XIcon } from '../ui/Icon'

/** A checklist of subtasks for a task, with a progress bar. */
export function SubtaskList({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const { data: subtasks = [] } = useQuery({
    queryKey: qk.subtasks(taskId),
    queryFn: () => listSubtasks(taskId),
  })
  const [title, setTitle] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.subtasks(taskId) })
  const addMut = useMutation({
    mutationFn: (t: string) => createSubtask(taskId, t),
    onSuccess: () => {
      setTitle('')
      invalidate()
    },
  })
  const toggleMut = useMutation({
    mutationFn: (v: { id: string; is_done: boolean }) => updateSubtask(v.id, { is_done: v.is_done }),
    onSuccess: invalidate,
  })
  const delMut = useMutation({ mutationFn: (id: string) => deleteSubtask(id), onSuccess: invalidate })

  const done = subtasks.filter((s) => s.is_done).length

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-meta font-medium uppercase tracking-wide text-muted">Checklist</h3>
        {subtasks.length > 0 && (
          <span className="text-meta text-muted">
            {done}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${(done / subtasks.length) * 100}%` }}
          />
        </div>
      )}

      <ul className="space-y-0.5">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-paper">
            <input
              type="checkbox"
              checked={s.is_done}
              onChange={() => toggleMut.mutate({ id: s.id, is_done: !s.is_done })}
              className="h-4 w-4 shrink-0 accent-accent"
              aria-label={s.title}
            />
            <span
              className={`min-w-0 flex-1 truncate text-ui ${
                s.is_done ? 'text-muted line-through' : 'text-ink'
              }`}
            >
              {s.title}
            </span>
            <button
              type="button"
              onClick={() => delMut.mutate(s.id)}
              className="text-muted opacity-0 transition-opacity hover:text-priority-high group-hover:opacity-100"
              aria-label="Delete checklist item"
            >
              <XIcon size={14} />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          const t = title.trim()
          if (t) addMut.mutate(t)
        }}
        className="mt-1 flex items-center gap-2 px-1"
      >
        <PlusIcon size={15} className="shrink-0 text-muted" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add an item"
          className="flex-1 bg-transparent text-ui text-ink outline-none placeholder:text-muted"
        />
      </form>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PRIORITY_RANK } from '../../lib/constants'
import type { Profile, TaskPatch, TaskPriority, TaskStatus, TaskWithAssignees } from '../../types'
import { StatusSelect } from './StatusSelect'
import { PrioritySelect } from './PrioritySelect'
import { AssigneePicker } from './AssigneePicker'
import { QuickAddTask } from './QuickAddTask'
import { DatePicker } from '../ui/DatePicker'
import { isOverdue } from '../ui/DueDate'
import { ChevronDownIcon, ChevronUpIcon } from '../ui/Icon'

type SortKey = 'title' | 'status' | 'priority' | 'due_date' | 'updated_at'
type SortDir = 'asc' | 'desc'

const STATUS_ORDER: Record<TaskStatus, number> = {
  not_started: 0,
  in_progress: 1,
  done: 2,
}

function priorityRank(p: TaskPriority | null): number {
  return p ? PRIORITY_RANK[p] : 0
}

interface TableViewProps {
  tasks: TaskWithAssignees[]
  onOpenTask: (id: string) => void
  onPatch: (id: string, patch: TaskPatch) => void
  onAssign: (id: string, people: Profile[]) => void
  onAddTask: (title: string) => Promise<void>
}

export function TableView({ tasks, onOpenTask, onPatch, onAssign, onAddTask }: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFinished, setShowFinished] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) {
      return [...tasks].sort(
        (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
      )
    }
    const dir = sortDir === 'asc' ? 1 : -1
    return [...tasks].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'status':
          cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
          break
        case 'priority':
          // Nulls (no priority) last regardless of direction, like the Due column.
          if (!a.priority && !b.priority) cmp = 0
          else if (!a.priority) return 1
          else if (!b.priority) return -1
          else cmp = priorityRank(a.priority) - priorityRank(b.priority)
          break
        case 'due_date':
          // Nulls last regardless of direction.
          if (!a.due_date && !b.due_date) cmp = 0
          else if (!a.due_date) return 1
          else if (!b.due_date) return -1
          else cmp = a.due_date.localeCompare(b.due_date)
          break
        case 'updated_at':
          cmp = a.updated_at.localeCompare(b.updated_at)
          break
      }
      return cmp * dir
    })
  }, [tasks, sortKey, sortDir])

  // Finished (done) tasks are pulled out of the main list into a collapsed
  // section so they don't clutter the active work.
  const active = useMemo(() => sorted.filter((t) => t.status !== 'done'), [sorted])
  const finished = useMemo(() => sorted.filter((t) => t.status === 'done'), [sorted])

  return (
    <div className="max-w-4xl overflow-x-auto">
      <table className="w-full border-collapse text-ui">
        <thead>
          <tr className="border-b border-line text-left text-meta text-muted">
            <Th className="min-w-[220px]">Title</Th>
            <SortableTh label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
            <Th className="hidden md:table-cell">Assignees</Th>
            <SortableTh label="Due" active={sortKey === 'due_date'} dir={sortDir} onClick={() => toggleSort('due_date')} />
            <SortableTh label="Priority" active={sortKey === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
            <SortableTh
              className="hidden lg:table-cell"
              label="Updated"
              active={sortKey === 'updated_at'}
              dir={sortDir}
              onClick={() => toggleSort('updated_at')}
            />
          </tr>
        </thead>
        <tbody>
          {active.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpenTask={onOpenTask}
              onPatch={onPatch}
              onAssign={onAssign}
            />
          ))}
          {finished.length > 0 && (
            <>
              <tr>
                <td colSpan={6} className="pt-3">
                  <button
                    type="button"
                    onClick={() => setShowFinished((s) => !s)}
                    aria-expanded={showFinished}
                    className="inline-flex items-center gap-1.5 rounded px-1 py-1 text-meta font-medium uppercase tracking-wide text-muted transition-colors hover:text-ink"
                  >
                    {showFinished ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                    Finished
                    <span className="rounded-full bg-paper px-1.5 normal-case text-muted">
                      {finished.length}
                    </span>
                  </button>
                </td>
              </tr>
              {showFinished &&
                finished.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onOpenTask={onOpenTask}
                    onPatch={onPatch}
                    onAssign={onAssign}
                    done
                  />
                ))}
            </>
          )}
        </tbody>
      </table>

      <div className="max-w-sm py-2">
        <QuickAddTask onAdd={onAddTask} placeholder="New task" />
      </div>
    </div>
  )
}

function TaskRow({
  task,
  onOpenTask,
  onPatch,
  onAssign,
  done = false,
}: {
  task: TaskWithAssignees
  onOpenTask: (id: string) => void
  onPatch: (id: string, patch: TaskPatch) => void
  onAssign: (id: string, people: Profile[]) => void
  done?: boolean
}) {
  return (
    <tr className="border-b border-line transition-colors hover:bg-accent-soft/40">
      <td className="py-1 pr-3">
        <button
          type="button"
          onClick={() => onOpenTask(task.id)}
          className={`rounded px-1 py-1 text-left hover:text-accent ${
            done ? 'text-muted line-through' : 'text-ink'
          }`}
        >
          {task.title}
        </button>
      </td>
      <td className="py-1 pr-3">
        <StatusSelect value={task.status} onChange={(status) => onPatch(task.id, { status })} />
      </td>
      <td className="hidden py-1 pr-3 md:table-cell">
        <AssigneePicker value={task.assignees} onChange={(people) => onAssign(task.id, people)} />
      </td>
      <td className="py-1 pr-3">
        <DatePicker
          value={task.due_date}
          onChange={(date) => onPatch(task.id, { due_date: date })}
          ariaLabel="Set due date"
          buttonClassName={`inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-ui transition-colors hover:border-line hover:bg-paper ${
            isOverdue(task.due_date, task.status === 'done')
              ? 'font-medium text-priority-high'
              : 'text-ink'
          }`}
        />
      </td>
      <td className="py-1 pr-3">
        <PrioritySelect value={task.priority} onChange={(priority) => onPatch(task.id, { priority })} />
      </td>
      <td className="hidden py-1 pr-3 text-meta text-muted lg:table-cell">
        {format(parseISO(task.updated_at), 'MMM d')}
      </td>
    </tr>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-2 pr-3 font-medium ${className}`}>{children}</th>
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className = '',
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <th className={`py-2 pr-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-ink ${
          active ? 'text-ink' : ''
        }`}
      >
        {label}
        {active &&
          (dir === 'asc' ? <ChevronUpIcon size={13} /> : <ChevronDownIcon size={13} />)}
      </button>
    </th>
  )
}

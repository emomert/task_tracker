import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import type { TaskWithAssignees } from '../../types'
import { StatusDot } from '../ui/StatusBadge'
import { isOverdue } from '../ui/DueDate'
import { ChevronLeftIcon, ChevronRightIcon } from '../ui/Icon'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarViewProps {
  tasks: TaskWithAssignees[]
  onOpenTask: (id: string) => void
}

/** A month calendar laying the project's tasks out by due date. */
export function CalendarView({ tasks, onOpenTask }: CalendarViewProps) {
  const [month, setMonth] = useState<Date>(startOfMonth(startOfToday()))

  const byDate = new Map<string, TaskWithAssignees[]>()
  const noDate: TaskWithAssignees[] = []
  for (const t of tasks) {
    if (!t.due_date) {
      noDate.push(t)
      continue
    }
    const arr = byDate.get(t.due_date) ?? []
    arr.push(t)
    byDate.set(t.due_date, arr)
  }

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })

  return (
    <div className="max-w-5xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-title font-semibold text-ink">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn-ghost p-1.5"
            onClick={() => setMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMonth(startOfMonth(startOfToday()))}
          >
            Today
          </button>
          <button
            type="button"
            className="btn-ghost p-1.5"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-card border-l border-t border-line">
        {DOW.map((d) => (
          <div
            key={d}
            className="border-b border-r border-line bg-paper px-2 py-1 text-meta font-medium text-muted"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayTasks = byDate.get(key) ?? []
          const inMonth = isSameMonth(day, month)
          return (
            <div
              key={key}
              className={`min-h-[96px] border-b border-r border-line p-1 ${
                isToday(day) ? 'bg-accent-soft' : inMonth ? '' : 'bg-paper/40'
              }`}
            >
              <div className="px-1">
                <span
                  className={
                    isToday(day)
                      ? 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1 text-meta font-semibold text-white'
                      : `text-meta ${inMonth ? 'text-ink' : 'text-muted/60'}`
                  }
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => {
                  const overdue = isOverdue(t.due_date, t.status === 'done')
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onOpenTask(t.id)}
                      className={`flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-meta transition-colors hover:bg-accent-soft ${
                        overdue ? 'text-priority-high' : 'text-ink'
                      }`}
                    >
                      <StatusDot status={t.status} size={6} />
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          t.status === 'done' ? 'text-muted line-through' : ''
                        }`}
                      >
                        {t.title}
                      </span>
                    </button>
                  )
                })}
                {dayTasks.length > 3 && (
                  <div className="px-1 text-meta text-muted">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {noDate.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-meta font-medium uppercase tracking-wide text-muted">
            No due date ({noDate.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {noDate.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onOpenTask(t.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-meta text-ink transition-colors hover:bg-paper"
              >
                <StatusDot status={t.status} size={6} />
                <span className="max-w-[200px] truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

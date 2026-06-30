import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { addDays, isAfter, isBefore, parseISO, startOfToday } from 'date-fns'
import { useAuth } from '../auth/AuthContext'
import { qk } from '../lib/queryClient'
import { listMyTasks } from '../lib/api/tasks'
import { PRIORITY_RANK } from '../lib/constants'
import type { MyTask } from '../types'
import { LoadingArea } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { StatusDot } from '../components/ui/StatusBadge'
import { DueDate } from '../components/ui/DueDate'
import { PriorityMarker } from '../components/ui/PriorityMarker'

type Bucket = 'overdue' | 'week' | 'later' | 'none' | 'done'

const SECTIONS: Array<{ key: Bucket; title: string }> = [
  { key: 'overdue', title: 'Overdue' },
  { key: 'week', title: 'This week' },
  { key: 'later', title: 'Later' },
  { key: 'none', title: 'No due date' },
  { key: 'done', title: 'Done' },
]

/** The personal "My Work" home: every task assigned to me, grouped by urgency. */
export function MyWorkPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? ''

  const query = useQuery({
    queryKey: qk.myTasks(userId),
    queryFn: () => listMyTasks(userId),
    enabled: !!userId,
  })

  const groups = useMemo(() => {
    const today = startOfToday()
    const weekEnd = addDays(today, 7)
    const out: Record<Bucket, MyTask[]> = {
      overdue: [],
      week: [],
      later: [],
      none: [],
      done: [],
    }
    for (const t of query.data ?? []) {
      let bucket: Bucket
      if (t.status === 'done') bucket = 'done'
      else if (!t.due_date) bucket = 'none'
      else {
        const d = parseISO(t.due_date)
        if (isBefore(d, today)) bucket = 'overdue'
        else if (!isAfter(d, weekEnd)) bucket = 'week'
        else bucket = 'later'
      }
      out[bucket].push(t)
    }
    for (const key of Object.keys(out) as Bucket[]) {
      out[key].sort((a, b) => {
        const ad = a.due_date ?? '9999-99-99'
        const bd = b.due_date ?? '9999-99-99'
        if (ad !== bd) return ad < bd ? -1 : 1
        return (b.priority ? PRIORITY_RANK[b.priority] : 0) - (a.priority ? PRIORITY_RANK[a.priority] : 0)
      })
    }
    return out
  }, [query.data])

  if (query.isLoading) return <LoadingArea />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const activeCount = (query.data ?? []).filter((t) => t.status !== 'done').length
  const visibleSections = SECTIONS.filter((s) => groups[s.key].length > 0)

  let rowIndex = 0

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <h1 className="text-display font-semibold text-ink">Your work</h1>
      <p className="mt-1 text-ui text-muted">
        {activeCount > 0
          ? `${activeCount} task${activeCount === 1 ? '' : 's'} assigned to you across your projects.`
          : 'Tasks assigned to you show up here.'}
      </p>

      {visibleSections.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <span className="text-3xl" aria-hidden="true">
            🌤️
          </span>
          <p className="text-ui text-muted">
            You're all caught up. Anything assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {visibleSections.map((section) => (
            <section key={section.key}>
              <h2 className="mb-2 flex items-center gap-2 text-meta font-medium uppercase tracking-wide text-muted">
                {section.title}
                <span className="rounded-full bg-paper px-1.5 text-meta normal-case text-muted">
                  {groups[section.key].length}
                </span>
              </h2>
              <div className="overflow-hidden rounded-card border border-line bg-surface">
                {groups[section.key].map((task) => {
                  const i = rowIndex++
                  const done = task.status === 'done'
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => navigate(`/project/${task.project.id}/task/${task.id}`)}
                      style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                      className="wt-animate-row flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent-soft/40"
                    >
                      <StatusDot status={task.status} />
                      <span
                        className={`min-w-0 flex-1 truncate text-ui ${
                          done ? 'text-muted line-through' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="hidden items-center gap-1 text-meta text-muted sm:flex">
                        <span aria-hidden="true">{task.project.emoji}</span>
                        <span className="max-w-[120px] truncate">{task.project.name}</span>
                      </span>
                      <PriorityMarker priority={task.priority} variant="dot" />
                      <DueDate date={task.due_date} done={done} withIcon />
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

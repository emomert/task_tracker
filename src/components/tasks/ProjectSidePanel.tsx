import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import type { Project, TaskWithAssignees } from '../../types'
import { projectColor } from '../../lib/constants'
import { qk } from '../../lib/queryClient'
import { listTeams } from '../../lib/api/teams'
import { isOverdue } from '../ui/DueDate'
import { StatusDot } from '../ui/StatusBadge'
import { ArchiveIcon, PencilIcon, UsersIcon } from '../ui/Icon'

interface ProjectSidePanelProps {
  project: Project
  tasks: TaskWithAssignees[]
  onEdit: () => void
  onArchive: () => void
}

/** Context panel on the right of the project page — keeps the wide space useful. */
export function ProjectSidePanel({ project, tasks, onEdit, onArchive }: ProjectSidePanelProps) {
  const stats = useMemo(() => {
    let notStarted = 0
    let inProgress = 0
    let done = 0
    let overdue = 0
    for (const t of tasks) {
      if (t.status === 'not_started') notStarted++
      else if (t.status === 'in_progress') inProgress++
      else done++
      if (isOverdue(t.due_date, t.status === 'done')) overdue++
    }
    return { total: tasks.length, notStarted, inProgress, done, overdue }
  }, [tasks])

  const color = projectColor(project.color)
  const teamsQuery = useQuery({ queryKey: qk.teams, queryFn: listTeams })
  const teamName = project.team_id
    ? teamsQuery.data?.find((t) => t.id === project.team_id)?.name
    : null

  return (
    <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-line p-4 lg:block">
      <div className="flex items-start gap-2.5">
        <span className="text-2xl leading-none" aria-hidden="true">
          {project.emoji}
        </span>
        <div className="min-w-0">
          <div className="truncate text-ui font-semibold text-ink">{project.name}</div>
          <div className="mt-0.5 inline-flex items-center gap-1.5 text-meta text-muted">
            <span className={`h-2 w-2 rounded-full ${color.dot}`} aria-hidden="true" />
            {color.label}
            {project.is_archived && <span className="text-muted">· archived</span>}
          </div>
        </div>
      </div>

      <div className="mt-3 inline-flex items-center gap-1.5 text-meta text-muted">
        <UsersIcon size={13} />
        {teamName ?? 'No team (everyone)'}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-meta font-medium uppercase tracking-wide text-muted">Tasks</h3>
        <dl className="space-y-1.5 text-ui">
          <StatRow label="Total" value={stats.total} />
          <StatRow label="Not started" value={stats.notStarted} dot={<StatusDot status="not_started" />} />
          <StatRow label="In progress" value={stats.inProgress} dot={<StatusDot status="in_progress" />} />
          <StatRow label="Done" value={stats.done} dot={<StatusDot status="done" />} />
          {stats.overdue > 0 && (
            <div className="flex items-center justify-between text-priority-high">
              <span className="font-medium">Overdue</span>
              <span className="font-semibold">{stats.overdue}</span>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-5 border-t border-line pt-3 text-meta text-muted">
        Created {format(parseISO(project.created_at), 'MMM d, yyyy')}
      </div>

      <div className="mt-5 flex flex-col gap-1.5">
        <button type="button" onClick={onEdit} className="btn-secondary w-full justify-start">
          <PencilIcon size={15} /> Project settings
        </button>
        <button type="button" onClick={onArchive} className="btn-ghost w-full justify-start">
          <ArchiveIcon size={15} /> {project.is_archived ? 'Unarchive project' : 'Archive project'}
        </button>
      </div>
    </aside>
  )
}

function StatRow({ label, value, dot }: { label: string; value: number; dot?: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-ink">
      <span className="inline-flex items-center gap-2 text-muted">
        {dot}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

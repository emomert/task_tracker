import { PRIORITY_BY_VALUE } from '../../lib/constants'
import type { TaskPriority } from '../../types'

const CHIP_CLASS: Record<TaskPriority, string> = {
  low: 'text-priority-low bg-priority-low/10',
  medium: 'text-priority-medium bg-priority-medium/10',
  high: 'text-priority-high bg-priority-high/10',
}

const DOT_CLASS: Record<TaskPriority, string> = {
  low: 'bg-priority-low',
  medium: 'bg-priority-medium',
  high: 'bg-priority-high',
}

/** A small colored chip (or dot) for a task's priority. Renders nothing when unset. */
export function PriorityMarker({
  priority,
  variant = 'chip',
}: {
  priority: TaskPriority | null
  variant?: 'chip' | 'dot'
}) {
  if (!priority) return null
  const meta = PRIORITY_BY_VALUE[priority]

  if (variant === 'dot') {
    return (
      <span
        aria-label={`${meta.label} priority`}
        title={`${meta.label} priority`}
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[priority]}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-meta font-medium ${CHIP_CLASS[priority]}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[priority]}`} />
      {meta.label}
    </span>
  )
}

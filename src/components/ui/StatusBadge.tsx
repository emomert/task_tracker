import { STATUS_BY_VALUE } from '../../lib/constants'
import type { TaskStatus } from '../../types'

const DOT_CLASS: Record<TaskStatus, string> = {
  not_started: 'bg-status-notstarted',
  in_progress: 'bg-status-inprogress',
  done: 'bg-status-done',
}

export function StatusDot({ status, size = 8 }: { status: TaskStatus; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${DOT_CLASS[status]}`}
      style={{ width: size, height: size }}
    />
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_BY_VALUE[status]
  return (
    <span className="inline-flex items-center gap-1.5 text-ui text-ink">
      <StatusDot status={status} />
      {meta.label}
    </span>
  )
}

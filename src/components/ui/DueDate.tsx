import { format, isBefore, parseISO, startOfToday } from 'date-fns'
import { CalendarIcon } from './Icon'

interface DueDateProps {
  date: string | null
  /** When the task is done, never style as overdue. */
  done?: boolean
  withIcon?: boolean
  emptyText?: string
}

export function isOverdue(date: string | null, done = false): boolean {
  if (!date || done) return false
  return isBefore(parseISO(date), startOfToday())
}

export function DueDate({ date, done = false, withIcon = false, emptyText }: DueDateProps) {
  if (!date) {
    return emptyText ? <span className="text-muted">{emptyText}</span> : null
  }

  const overdue = isOverdue(date, done)
  const label = format(parseISO(date), 'MMM d')

  return (
    <span
      className={`inline-flex items-center gap-1 text-meta ${
        overdue ? 'font-medium text-priority-high' : 'text-muted'
      }`}
      title={overdue ? `Overdue — ${format(parseISO(date), 'PPP')}` : format(parseISO(date), 'PPP')}
    >
      {withIcon && <CalendarIcon size={13} />}
      {label}
    </span>
  )
}

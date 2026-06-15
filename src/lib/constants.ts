import type { TaskPriority, TaskStatus } from '../types'

export interface StatusMeta {
  value: TaskStatus
  label: string
  /** CSS color for the status dot/chip. */
  color: string
}

export interface PriorityMeta {
  value: TaskPriority
  label: string
  color: string
}

// Ordered for the board columns (Not Started -> In Progress -> Done).
export const STATUSES: StatusMeta[] = [
  { value: 'not_started', label: 'Not started', color: 'rgb(var(--status-not-started))' },
  { value: 'in_progress', label: 'In progress', color: 'rgb(var(--status-in-progress))' },
  { value: 'done', label: 'Done', color: 'rgb(var(--status-done))' },
]

export const STATUS_BY_VALUE: Record<TaskStatus, StatusMeta> = {
  not_started: STATUSES[0],
  in_progress: STATUSES[1],
  done: STATUSES[2],
}

// Ordered high -> low for sorting; displayed however the view needs.
export const PRIORITIES: PriorityMeta[] = [
  { value: 'high', label: 'High', color: 'rgb(var(--priority-high))' },
  { value: 'medium', label: 'Medium', color: 'rgb(var(--priority-medium))' },
  { value: 'low', label: 'Low', color: 'rgb(var(--priority-low))' },
]

export const PRIORITY_BY_VALUE: Record<TaskPriority, PriorityMeta> = {
  high: PRIORITIES[0],
  medium: PRIORITIES[1],
  low: PRIORITIES[2],
}

/** Rank used when sorting by priority (higher = more urgent). NULL sorts last. */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

export const DEFAULT_PROJECT_EMOJI = '📁'
export const DEFAULT_PERSON_EMOJI = '🙂'

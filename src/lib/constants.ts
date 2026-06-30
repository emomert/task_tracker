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

// ---------- Project colors ----------
export interface ProjectColorMeta {
  key: string
  label: string
  /** Solid swatch / dot. */
  dot: string
  /** Soft tinted surface for accents/chips. */
  soft: string
  /** Readable text color on the soft surface. */
  text: string
}

// Fixed palette. Class names are full literals so Tailwind's content scan keeps
// them; the same hues read fine in both light and dark.
export const PROJECT_COLORS: ProjectColorMeta[] = [
  { key: 'neutral', label: 'Neutral', dot: 'bg-slate-400', soft: 'bg-slate-400/15', text: 'text-slate-500' },
  { key: 'red', label: 'Red', dot: 'bg-red-500', soft: 'bg-red-500/15', text: 'text-red-500' },
  { key: 'orange', label: 'Orange', dot: 'bg-orange-500', soft: 'bg-orange-500/15', text: 'text-orange-500' },
  { key: 'amber', label: 'Amber', dot: 'bg-amber-500', soft: 'bg-amber-500/15', text: 'text-amber-600' },
  { key: 'green', label: 'Green', dot: 'bg-emerald-500', soft: 'bg-emerald-500/15', text: 'text-emerald-600' },
  { key: 'blue', label: 'Blue', dot: 'bg-blue-500', soft: 'bg-blue-500/15', text: 'text-blue-500' },
  { key: 'purple', label: 'Purple', dot: 'bg-violet-500', soft: 'bg-violet-500/15', text: 'text-violet-500' },
  { key: 'pink', label: 'Pink', dot: 'bg-pink-500', soft: 'bg-pink-500/15', text: 'text-pink-500' },
]

const PROJECT_COLOR_MAP: Record<string, ProjectColorMeta> = Object.fromEntries(
  PROJECT_COLORS.map((c) => [c.key, c]),
)

/** Resolve a stored color key to its palette entry (falls back to neutral). */
export function projectColor(key: string | null | undefined): ProjectColorMeta {
  return (key && PROJECT_COLOR_MAP[key]) || PROJECT_COLORS[0]
}

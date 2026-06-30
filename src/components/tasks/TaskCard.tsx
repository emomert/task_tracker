import { useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { TaskWithAssignees } from '../../types'
import { AssigneeChips } from '../ui/AssigneeChips'
import { DueDate } from '../ui/DueDate'
import { PriorityMarker } from '../ui/PriorityMarker'

/** Pure visual card — used both in the column and in the drag overlay. */
export function TaskCardContent({
  task,
  dragging = false,
}: {
  task: TaskWithAssignees
  dragging?: boolean
}) {
  const hasTop = task.priority || task.due_date
  const hasAssignees = task.assignees.length > 0
  return (
    <div
      className={`rounded-card border border-line bg-surface p-3 transition-shadow ${
        dragging ? 'shadow-drag' : 'shadow-card hover:shadow-drag'
      }`}
    >
      <div className="text-ui leading-snug text-ink">{task.title}</div>
      {(hasTop || hasAssignees) && (
        <div className="mt-2.5 space-y-2">
          {hasTop && (
            <div className="flex items-center gap-2">
              <PriorityMarker priority={task.priority} variant="dot" />
              <DueDate date={task.due_date} done={task.status === 'done'} withIcon />
            </div>
          )}
          {hasAssignees && <AssigneeChips people={task.assignees} max={3} />}
        </div>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: TaskWithAssignees
  onOpen: () => void
}

export function TaskCard({ task, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const downPos = useRef<{ x: number; y: number } | null>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={(e) => {
        downPos.current = { x: e.clientX, y: e.clientY }
        // Preserve dnd-kit's own pointer handling.
        listeners?.onPointerDown?.(e)
      }}
      onClick={(e) => {
        // Ignore the click that follows an actual drag.
        const d = downPos.current
        if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return
        onOpen()
      }}
      className="cursor-pointer rounded-card outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent"
      onKeyDown={(e) => {
        // Enter opens the task; leave Space (dnd-kit's pickup key) to the sensor.
        if (e.key === 'Enter') {
          e.preventDefault()
          onOpen()
          return
        }
        listeners?.onKeyDown?.(e)
      }}
    >
      <TaskCardContent task={task} />
    </div>
  )
}

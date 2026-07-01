import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { StatusDot } from '../ui/StatusBadge'
import { STATUS_BY_VALUE } from '../../lib/constants'
import type { TaskStatus, TaskWithAssignees } from '../../types'
import { TaskCard } from './TaskCard'
import { QuickAddTask } from './QuickAddTask'

interface BoardColumnProps {
  status: TaskStatus
  tasks: TaskWithAssignees[]
  onOpenTask: (id: string) => void
  onAddTask: (title: string, status: TaskStatus) => Promise<void>
}

export function BoardColumn({ status, tasks, onOpenTask, onAddTask }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = STATUS_BY_VALUE[status]

  return (
    // flex-1 + a min width so the three columns share the board width equally
    // (symmetric, edge-to-edge) on desktop and scroll horizontally when narrow.
    <div className="flex min-w-[15rem] flex-1 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1.5">
        <StatusDot status={status} />
        <span className="text-ui font-medium text-ink">{meta.label}</span>
        <span className="text-meta text-muted">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex min-h-[80px] flex-1 flex-col gap-2 rounded-card p-1 transition-colors ${
          isOver ? 'bg-accent-soft/60' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="rounded-md border border-dashed border-line py-6 text-center text-meta text-muted">
              Drop tasks here
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard key={task.id} task={task} onOpen={() => onOpenTask(task.id)} />
            ))
          )}
        </SortableContext>

        <div className="pt-0.5">
          <QuickAddTask onAdd={(title) => onAddTask(title, status)} placeholder="Add task" />
        </div>
      </div>
    </div>
  )
}

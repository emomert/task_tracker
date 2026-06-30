import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { STATUSES } from '../../lib/constants'
import { sortKeyBetween } from '../../lib/sort'
import type { TaskStatus, TaskWithAssignees } from '../../types'
import { BoardColumn } from './BoardColumn'
import { TaskCardContent } from './TaskCard'

type Columns = Record<TaskStatus, TaskWithAssignees[]>

const EMPTY_COLUMNS: () => Columns = () => ({
  not_started: [],
  in_progress: [],
  done: [],
})

function groupByStatus(tasks: TaskWithAssignees[]): Columns {
  const cols = EMPTY_COLUMNS()
  for (const t of tasks) cols[t.status].push(t)
  for (const status of Object.keys(cols) as TaskStatus[]) {
    cols[status].sort(
      (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
    )
  }
  return cols
}

function isStatusId(id: string): id is TaskStatus {
  return id === 'not_started' || id === 'in_progress' || id === 'done'
}

interface BoardViewProps {
  tasks: TaskWithAssignees[]
  onOpenTask: (id: string) => void
  onAddTask: (title: string, status: TaskStatus) => Promise<void>
  onMove: (id: string, status: TaskStatus, sortOrder: number) => void
}

export function BoardView({ tasks, onOpenTask, onAddTask, onMove }: BoardViewProps) {
  const [columns, setColumns] = useState<Columns>(() => groupByStatus(tasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const dragging = useRef(false)
  const fromRef = useRef<TaskStatus | null>(null)

  // Adopt server state whenever we're not mid-drag.
  useEffect(() => {
    if (!dragging.current) setColumns(groupByStatus(tasks))
  }, [tasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeTask = useMemo(() => {
    if (!activeId) return null
    for (const status of Object.keys(columns) as TaskStatus[]) {
      const found = columns[status].find((t) => t.id === activeId)
      if (found) return found
    }
    return null
  }, [activeId, columns])

  function findContainer(id: string): TaskStatus | null {
    if (isStatusId(id)) return id
    for (const status of Object.keys(columns) as TaskStatus[]) {
      if (columns[status].some((t) => t.id === id)) return status
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    dragging.current = true
    fromRef.current = findContainer(String(event.active.id))
    setActiveId(String(event.active.id))
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const id = String(active.id)
    const overId = String(over.id)
    const from = findContainer(id)
    const to = findContainer(overId)
    if (!from || !to || from === to) return

    setColumns((prev) => {
      const moving = prev[from].find((t) => t.id === id)
      if (!moving) return prev
      const newFrom = prev[from].filter((t) => t.id !== id)
      const overIndex = prev[to].findIndex((t) => t.id === overId)
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length
      const newTo = [
        ...prev[to].slice(0, insertAt),
        { ...moving, status: to },
        ...prev[to].slice(insertAt),
      ]
      return { ...prev, [from]: newFrom, [to]: newTo }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    dragging.current = false
    const from = fromRef.current
    fromRef.current = null
    setActiveId(null)
    if (!over) {
      setColumns(groupByStatus(tasks))
      return
    }

    const id = String(active.id)
    const overId = String(over.id)
    const to = findContainer(overId) ?? findContainer(id)
    if (!to) {
      setColumns(groupByStatus(tasks))
      return
    }

    const items = columns[to]
    // Cross-column moves were already placed by handleDragOver, so only a
    // same-column reorder needs the move applied here (avoids a double-move).
    let ordered = items
    if (from === to) {
      const oldIndex = items.findIndex((t) => t.id === id)
      const overIndex = isStatusId(overId)
        ? items.length - 1
        : items.findIndex((t) => t.id === overId)
      if (oldIndex >= 0 && overIndex >= 0 && oldIndex !== overIndex) {
        ordered = arrayMove(items, oldIndex, overIndex)
      }
    }

    const idx = ordered.findIndex((t) => t.id === id)
    if (idx < 0) {
      setColumns(groupByStatus(tasks))
      return
    }
    const before = ordered[idx - 1]
    const after = ordered[idx + 1]
    const newSort = sortKeyBetween(before?.sort_order ?? null, after?.sort_order ?? null)

    const finalItems = ordered.map((t) =>
      t.id === id ? { ...t, status: to, sort_order: newSort } : t,
    )
    setColumns({ ...columns, [to]: finalItems })
    onMove(id, to, newSort)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto px-1 pb-4">
        {STATUSES.map((s) => (
          <BoardColumn
            key={s.value}
            status={s.value}
            tasks={columns[s.value]}
            onOpenTask={onOpenTask}
            onAddTask={onAddTask}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-72 rotate-1">
            <TaskCardContent task={activeTask} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

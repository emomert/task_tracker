import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useProjectTasks } from '../../hooks/useProjectTasks'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { StatusSelect } from './StatusSelect'
import { PrioritySelect } from './PrioritySelect'
import { AssigneePicker } from './AssigneePicker'
import { SubtaskList } from './SubtaskList'
import { CommentThread } from './CommentThread'
import { DatePicker } from '../ui/DatePicker'
import { LoadingArea } from '../ui/Spinner'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { TrashIcon, XIcon } from '../ui/Icon'

// Code-split the heavy BlockNote editor so it isn't in the initial bundle.
const MarkdownDocEditor = lazy(() =>
  import('../editor/MarkdownDocEditor').then((m) => ({ default: m.MarkdownDocEditor })),
)

export function TaskDetailPanel() {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { tasks, isLoading, patch, assign, remove, saveBody } = useProjectTasks(projectId ?? '')

  const task = tasks.find((t) => t.id === taskId) ?? null

  const [title, setTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useFocusTrap(panelRef, !!task, { focusContainer: true })

  useEffect(() => {
    if (task) setTitle(task.title)
  }, [task?.id, task?.title])

  // Auto-grow the title so long text wraps to new lines instead of scrolling sideways.
  useEffect(() => {
    const el = titleRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [title])

  const close = () => navigate(`/project/${projectId}`)

  // Lock background scroll while the panel is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // Let an open confirm dialog handle its own Escape.
      if (confirmDelete) return
      // Don't close while typing in the BlockNote editor or using the native
      // date picker (those use Escape for their own dismiss). Escape from the
      // title field (or anywhere else) still closes the panel.
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.isContentEditable ||
          t.closest('.wt-editor') ||
          (t.tagName === 'INPUT' && (t as HTMLInputElement).type === 'date'))
      ) {
        return
      }
      commitTitle()
      close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, confirmDelete, title, task])

  function commitTitle() {
    const trimmed = title.trim()
    if (task && trimmed && trimmed !== task.title) {
      patch(task.id, { title: trimmed })
    } else if (task && !trimmed) {
      setTitle(task.title)
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="wt-animate-overlay absolute inset-0 bg-black/20" onClick={close} aria-hidden="true" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="wt-animate-drawer absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-surface shadow-panel outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {isLoading && !task ? (
          <LoadingArea />
        ) : !task ? (
          <div className="flex h-full flex-col">
            <div className="flex justify-end p-3">
              <button type="button" className="btn-ghost p-1.5" onClick={close} aria-label="Close">
                <XIcon size={18} />
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center px-6 text-center text-ui text-muted">
              This task no longer exists.
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start gap-2 border-b border-line px-5 py-3">
              <textarea
                ref={titleRef}
                value={title}
                rows={1}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    ;(e.target as HTMLTextAreaElement).blur()
                  }
                }}
                className="min-w-0 flex-1 resize-none overflow-hidden rounded-md border border-transparent bg-transparent px-2 py-1 text-title font-semibold leading-snug text-ink outline-none hover:border-line focus:border-accent focus:ring-2 focus:ring-accent/20"
                aria-label="Task title"
              />
              <button
                type="button"
                className="btn-ghost p-1.5"
                onClick={close}
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Body (scrolls) */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
              {/* Fields */}
              <dl className="grid grid-cols-[110px_1fr] items-center gap-y-2 text-ui">
                <dt className="text-meta text-muted">Status</dt>
                <dd>
                  <StatusSelect value={task.status} onChange={(status) => patch(task.id, { status })} />
                </dd>

                <dt className="text-meta text-muted">Assignees</dt>
                <dd>
                  <AssigneePicker
                    value={task.assignees}
                    onChange={(people) => assign(task.id, people)}
                  />
                </dd>

                <dt className="text-meta text-muted">Due date</dt>
                <dd>
                  <DatePicker
                    value={task.due_date}
                    onChange={(date) => patch(task.id, { due_date: date })}
                    ariaLabel="Set due date"
                  />
                </dd>

                <dt className="text-meta text-muted">Priority</dt>
                <dd>
                  <PrioritySelect
                    value={task.priority}
                    onChange={(priority) => patch(task.id, { priority })}
                  />
                </dd>
              </dl>

              <div className="mt-3 flex items-center gap-3 text-meta text-muted">
                <span>Created {format(parseISO(task.created_at), 'MMM d, yyyy')}</span>
                <span aria-hidden="true">·</span>
                <span>Updated {format(parseISO(task.updated_at), 'MMM d, yyyy')}</span>
              </div>

              <hr className="my-4 border-line" />
              <SubtaskList taskId={task.id} />

              <hr className="my-4 border-line" />
              {/* Markdown document */}
              <div className="min-h-[200px]">
                <Suspense fallback={<LoadingArea label="Loading editor" />}>
                  <MarkdownDocEditor
                    key={task.id}
                    initialMarkdown={task.body_md ?? ''}
                    onSave={(md) => saveBody(task.id, md)}
                  />
                </Suspense>
              </div>

              <hr className="my-4 border-line" />
              <CommentThread taskId={task.id} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-ui text-priority-high transition-colors hover:bg-priority-high/10"
              >
                <TrashIcon size={16} /> Delete task
              </button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete task"
        message={task ? `Delete “${task.title}”? This can't be undone.` : ''}
        confirmLabel="Delete task"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (task) await remove(task.id)
          setConfirmDelete(false)
          close()
        }}
      />
    </div>
  )
}

import { Suspense, lazy, useEffect, useState } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/queryClient'
import { getProject, updateProject } from '../lib/api/projects'
import { useProjectTasks } from '../hooks/useProjectTasks'
import type { ProjectPatch, TaskStatus } from '../types'
import { EmojiPicker } from '../components/ui/EmojiPicker'
import { LoadingArea } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { BoardIcon, TableIcon, CalendarIcon, PencilIcon } from '../components/ui/Icon'
import { BoardView } from '../components/tasks/BoardView'
import { TableView } from '../components/tasks/TableView'
import { CalendarView } from '../components/tasks/CalendarView'
import { ProjectSidePanel } from '../components/tasks/ProjectSidePanel'
import { BoardSkeleton, ListSkeleton } from '../components/ui/Skeleton'
import { ProjectFormModal } from '../components/layout/ProjectFormModal'
import { useToast } from '../components/ui/Toast'
import { projectColor } from '../lib/constants'

// Code-split the heavy BlockNote editor out of the initial bundle.
const MarkdownDocEditor = lazy(() =>
  import('../components/editor/MarkdownDocEditor').then((m) => ({
    default: m.MarkdownDocEditor,
  })),
)

type View = 'board' | 'table' | 'calendar' | 'notes'

export function ProjectPage() {
  const { projectId } = useParams()
  const id = projectId ?? ''
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const projectQuery = useQuery({
    queryKey: qk.project(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  })

  const tasks = useProjectTasks(id)

  const [view, setView] = useState<View>('table')
  const [name, setName] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Table is the default whenever you open a different project.
  useEffect(() => {
    setView('table')
  }, [id])

  useEffect(() => {
    if (projectQuery.data) setName(projectQuery.data.name)
  }, [projectQuery.data?.id, projectQuery.data?.name])

  const updateMut = useMutation({
    mutationFn: (patch: ProjectPatch) => updateProject(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.project(id) })
      queryClient.invalidateQueries({ queryKey: qk.projects })
    },
    onError: () => {
      notify("Couldn't save the project change. Check your connection and try again.", 'error')
      // Re-sync the inline name field with the canonical value.
      if (projectQuery.data) setName(projectQuery.data.name)
    },
  })

  if (projectQuery.isLoading) return <LoadingArea />
  if (projectQuery.isError) return <ErrorState onRetry={() => projectQuery.refetch()} />
  if (!projectQuery.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-ui text-muted">This project no longer exists.</p>
        <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
          Back home
        </button>
      </div>
    )
  }

  const project = projectQuery.data

  function commitName() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== project.name) {
      updateMut.mutate({ name: trimmed })
    } else if (!trimmed) {
      setName(project.name)
    }
  }

  const openTask = (taskId: string) => navigate(`/project/${id}/task/${taskId}`)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-6 pb-3 pt-6 md:px-8">
        <EmojiPicker
          value={project.emoji}
          onChange={(emoji) => updateMut.mutate({ emoji })}
          size="md"
          ariaLabel="Project emoji"
        />
        <div className="group flex min-w-0 flex-1 items-center gap-1.5">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${projectColor(project.color).dot}`}
            aria-hidden="true"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-title font-semibold text-ink outline-none hover:border-line focus:border-accent focus:ring-2 focus:ring-accent/20"
            aria-label="Project name"
          />
          <PencilIcon
            size={14}
            className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Content + context panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-auto px-6 pb-8 md:px-8">
          {tasks.isError ? (
            <ErrorState onRetry={() => tasks.refetch()} />
          ) : tasks.isLoading && view !== 'notes' ? (
            view === 'board' ? (
              <BoardSkeleton />
            ) : (
              <ListSkeleton rows={6} />
            )
          ) : view === 'board' ? (
            <BoardView
              tasks={tasks.tasks}
              onOpenTask={openTask}
              onAddTask={(title, status: TaskStatus) => tasks.create({ title, status })}
              onMove={tasks.move}
            />
          ) : view === 'table' ? (
            <TableView
              tasks={tasks.tasks}
              onOpenTask={openTask}
              onPatch={tasks.patch}
              onAssign={tasks.assign}
              onAddTask={(title) => tasks.create({ title })}
            />
          ) : view === 'calendar' ? (
            <CalendarView tasks={tasks.tasks} onOpenTask={openTask} />
          ) : (
            <div className="mx-auto max-w-canvas">
              <Suspense fallback={<LoadingArea label="Loading editor" />}>
                <MarkdownDocEditor
                  key={project.id}
                  initialMarkdown={project.description_md ?? ''}
                  onSave={(md) => updateMut.mutateAsync({ description_md: md }).then(() => undefined)}
                />
              </Suspense>
            </div>
          )}
        </div>

        {(view === 'board' || view === 'table') && (
          <ProjectSidePanel
            project={project}
            tasks={tasks.tasks}
            onEdit={() => setSettingsOpen(true)}
            onArchive={() => updateMut.mutate({ is_archived: !project.is_archived })}
          />
        )}
      </div>

      {/* Task detail overlay */}
      <Outlet />

      <ProjectFormModal
        open={settingsOpen}
        mode="edit"
        initialName={project.name}
        initialEmoji={project.emoji}
        initialColor={project.color}
        initialTeamId={project.team_id}
        initialBrief={project.brief}
        onClose={() => setSettingsOpen(false)}
        onSubmit={async (values) => {
          await updateMut.mutateAsync(values)
        }}
      />
    </div>
  )
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const options: Array<{ value: View; label: string; icon?: React.ReactNode }> = [
    { value: 'board', label: 'Board', icon: <BoardIcon size={15} /> },
    { value: 'table', label: 'Table', icon: <TableIcon size={15} /> },
    { value: 'calendar', label: 'Calendar', icon: <CalendarIcon size={15} /> },
    { value: 'notes', label: 'Notes' },
  ]
  return (
    <div className="inline-flex items-center rounded-md border border-line bg-surface p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={view === o.value}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-ui transition-colors ${
            view === o.value
              ? 'bg-accent-soft font-medium text-accent'
              : 'text-muted hover:text-ink'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}

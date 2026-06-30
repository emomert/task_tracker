import { useMemo, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useAuth } from '../../auth/AuthContext'
import { qk } from '../../lib/queryClient'
import { sortKeyBetween } from '../../lib/sort'
import {
  createProject,
  deleteProject,
  listProjects,
  setProjectSortOrder,
  updateProject,
} from '../../lib/api/projects'
import { listProfiles } from '../../lib/api/profiles'
import { listTeams } from '../../lib/api/teams'
import type { Project } from '../../types'
import { Avatar, displayName } from '../ui/Avatar'
import { Spinner } from '../ui/Spinner'
import { Menu, MenuItem } from '../ui/Menu'
import { useToast } from '../ui/Toast'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ProjectFormModal } from './ProjectFormModal'
import {
  ArchiveIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripIcon,
  HomeIcon,
  LayersIcon,
  LogOutIcon,
  MoonIcon,
  MoreIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  TrashIcon,
  UsersIcon,
} from '../ui/Icon'
import { useTheme } from '../../theme/ThemeContext'
import { projectColor } from '../../lib/constants'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  isDrawer?: boolean
}

export function Sidebar({ collapsed, onToggleCollapse, isDrawer = false }: SidebarProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, signOut } = useAuth()
  const { notify } = useToast()
  const { resolved, toggle } = useTheme()
  const { projectId } = useParams()

  const projectsQuery = useQuery({ queryKey: qk.projects, queryFn: listProjects })
  const profilesQuery = useQuery({ queryKey: qk.profiles, queryFn: listProfiles })
  const teamsQuery = useQuery({ queryKey: qk.teams, queryFn: listTeams })

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const me = useMemo(
    () => profilesQuery.data?.find((p) => p.id === user?.id) ?? null,
    [profilesQuery.data, user?.id],
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const createMut = useMutation({
    mutationFn: (values: {
      name: string
      emoji: string
      color: string
      team_id: string | null
      brief: string | null
    }) => createProject(values),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: qk.projects })
      navigate(`/project/${project.id}`)
    },
  })

  const updateMut = useMutation({
    mutationFn: (input: {
      id: string
      name: string
      emoji: string
      color: string
      team_id: string | null
      brief: string | null
    }) =>
      updateProject(input.id, {
        name: input.name,
        emoji: input.emoji,
        color: input.color,
        team_id: input.team_id,
        brief: input.brief,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.projects }),
  })

  const archiveMut = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      updateProject(id, { is_archived: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.projects }),
    onError: () =>
      notify("Couldn't update the project. Check your connection and try again.", 'error'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: qk.projects })
      if (projectId === id) navigate('/')
    },
    onError: () =>
      notify("Couldn't delete the project. Check your connection and try again.", 'error'),
  })

  const projects = projectsQuery.data ?? []
  const activeProjects = projects.filter((p) => !p.is_archived)
  const archivedProjects = projects.filter((p) => p.is_archived)
  const narrow = collapsed && !isDrawer

  // Group active projects under their team (alphabetical; "No team" last).
  const teamNameById = new Map((teamsQuery.data ?? []).map((t) => [t.id, t.name]))
  const projectGroups = (() => {
    const byKey = new Map<string, Project[]>()
    for (const p of activeProjects) {
      const key = p.team_id ?? '__none__'
      const arr = byKey.get(key) ?? []
      arr.push(p)
      byKey.set(key, arr)
    }
    const groups = [...byKey.entries()].map(([key, list]) => ({
      key,
      label: key === '__none__' ? 'No team' : (teamNameById.get(key) ?? 'Team'),
      projects: list,
    }))
    groups.sort((a, b) => {
      if (a.key === '__none__') return 1
      if (b.key === '__none__') return -1
      return a.label.localeCompare(b.label)
    })
    return groups
  })()

  async function handleDragEnd(groupProjects: Project[], event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = groupProjects.findIndex((p) => p.id === active.id)
    const newIndex = groupProjects.findIndex((p) => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(groupProjects, oldIndex, newIndex)
    const moved = reordered[newIndex]
    const before = reordered[newIndex - 1]
    const after = reordered[newIndex + 1]
    const newSortOrder = sortKeyBetween(before?.sort_order ?? null, after?.sort_order ?? null)

    // Optimistic: just bump the moved project's sort_order in the cache.
    queryClient.setQueryData<Project[]>(qk.projects, (prev) =>
      (prev ?? []).map((p) => (p.id === moved.id ? { ...p, sort_order: newSortOrder } : p)),
    )
    try {
      await setProjectSortOrder(moved.id, newSortOrder)
    } finally {
      queryClient.invalidateQueries({ queryKey: qk.projects })
    }
  }

  const widthClass = isDrawer ? 'w-[260px]' : collapsed ? 'w-14' : 'w-60'

  return (
    <aside
      className={`flex h-full flex-col border-r border-line bg-paper transition-[width] duration-sidebar ${widthClass}`}
    >
      {/* Brand + collapse toggle */}
      <div className="flex h-12 items-center justify-between px-2.5">
        {!collapsed && (
          <span className="px-1 text-ui font-semibold tracking-tight text-ink">WorkTrack</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="btn-ghost p-1.5"
          aria-label={isDrawer ? 'Close menu' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeftIcon
            size={18}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* My Work — the personal dashboard / home */}
      <div className="px-2 pb-1 pt-1">
        <SidebarLink to="/" end icon={<HomeIcon size={18} />} label="My Work" collapsed={narrow} />
      </div>

      {/* Projects, grouped by team */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pt-1">
        {!collapsed && (
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-meta font-medium uppercase tracking-wide text-muted">
              Projects
            </span>
            <button
              type="button"
              className="btn-ghost p-1"
              aria-label="New project"
              title="New project"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon size={16} />
            </button>
          </div>
        )}

        {projectsQuery.isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : projectsQuery.isError ? (
          !collapsed && (
            <div className="px-1 py-3 text-meta">
              <p className="text-priority-high">Couldn't load projects.</p>
              <button
                type="button"
                onClick={() => projectsQuery.refetch()}
                className="mt-1 text-accent hover:underline"
              >
                Try again
              </button>
            </div>
          )
        ) : projects.length === 0 ? (
          !collapsed && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-1 w-full rounded-md border border-dashed border-line px-3 py-3 text-left text-meta text-muted transition-colors hover:border-accent hover:text-ink"
            >
              Create your first project
            </button>
          )
        ) : (
          <>
            {projectGroups.map((group) => (
              <div key={group.key} className="mb-2">
                {!narrow && (
                  <div className="px-1 pb-0.5 text-meta font-medium uppercase tracking-wide text-muted/80">
                    {group.label}
                  </div>
                )}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => handleDragEnd(group.projects, e)}
                >
                  <SortableContext
                    items={group.projects.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul className="space-y-0.5">
                      {group.projects.map((project) => (
                        <SidebarProjectItem
                          key={project.id}
                          project={project}
                          collapsed={narrow}
                          onEdit={() => setEditing(project)}
                          onDelete={() => setDeleting(project)}
                          onArchive={() => archiveMut.mutate({ id: project.id, value: true })}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            ))}

            {!collapsed && archivedProjects.length > 0 && (
              <div className="mt-2 border-t border-line pt-2">
                <button
                  type="button"
                  onClick={() => setShowArchived((s) => !s)}
                  className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-meta font-medium uppercase tracking-wide text-muted transition-colors hover:text-ink"
                  aria-expanded={showArchived}
                >
                  {showArchived ? <ChevronDownIcon size={13} /> : <ChevronRightIcon size={13} />}
                  Archived
                  <span className="ml-0.5 normal-case">({archivedProjects.length})</span>
                </button>
                {showArchived && (
                  <ul className="mt-0.5 space-y-0.5">
                    {archivedProjects.map((project) => (
                      <ArchivedProjectItem
                        key={project.id}
                        project={project}
                        onUnarchive={() => archiveMut.mutate({ id: project.id, value: false })}
                        onDelete={() => setDeleting(project)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {collapsed && !isDrawer && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-1 flex h-9 w-full items-center justify-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-ink"
            aria-label="New project"
            title="New project"
          >
            <PlusIcon size={18} />
          </button>
        )}
      </nav>

      {/* Secondary nav */}
      <div className="border-t border-line px-2 py-2">
        <SidebarLink to="/people" icon={<UsersIcon size={18} />} label="People" collapsed={narrow} />
        <SidebarLink to="/teams" icon={<LayersIcon size={18} />} label="Teams" collapsed={narrow} />
        <SidebarLink
          to="/settings"
          icon={<SettingsIcon size={18} />}
          label="Settings"
          collapsed={narrow}
        />
      </div>

      {/* User footer */}
      <div className="border-t border-line p-2">
        <div className={`flex items-center gap-2 ${narrow ? 'justify-center' : ''}`}>
          {me ? (
            <Avatar profile={me} size="sm" />
          ) : (
            <Avatar profile={{ emoji: '🙂', full_name: null, email: user?.email ?? null }} size="sm" />
          )}
          {!narrow && (
            <>
              <span className="min-w-0 flex-1 truncate text-meta text-muted">
                {me ? displayName(me) : user?.email}
              </span>
              <button
                type="button"
                onClick={toggle}
                className="btn-ghost p-1.5"
                aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                title={resolved === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {resolved === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
              </button>
              <button
                type="button"
                onClick={() => signOut()}
                className="btn-ghost p-1.5"
                aria-label="Log out"
                title="Log out"
              >
                <LogOutIcon size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await createMut.mutateAsync(values)
        }}
      />
      <ProjectFormModal
        open={editing != null}
        mode="edit"
        initialName={editing?.name}
        initialEmoji={editing?.emoji}
        initialColor={editing?.color}
        initialTeamId={editing?.team_id}
        initialBrief={editing?.brief}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          if (editing) await updateMut.mutateAsync({ id: editing.id, ...values })
        }}
      />
      <ConfirmDialog
        open={deleting != null}
        title="Delete project"
        message={
          deleting ? `Delete “${deleting.name}” and all of its tasks? This can't be undone.` : ''
        }
        confirmLabel="Delete project"
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await deleteMut.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </aside>
  )
}

function SidebarLink({
  to,
  icon,
  label,
  collapsed,
  end,
}: {
  to: string
  icon: React.ReactNode
  label: string
  collapsed: boolean
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-md px-2 py-1.5 text-ui transition-colors ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive ? 'bg-accent-soft font-medium text-accent' : 'text-ink hover:bg-accent-soft/60'
        }`
      }
    >
      {icon}
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

function SidebarProjectItem({
  project,
  collapsed,
  onEdit,
  onDelete,
  onArchive,
}: {
  project: Project
  collapsed: boolean
  onEdit: () => void
  onDelete: () => void
  onArchive: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="group relative">
      <NavLink
        to={`/project/${project.id}`}
        title={collapsed ? `${project.emoji} ${project.name}` : undefined}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-md py-1.5 pr-1 text-ui transition-colors ${
            collapsed ? 'justify-center px-0' : 'pl-1.5'
          } ${
            isActive ? 'bg-accent-soft font-medium text-accent' : 'text-ink hover:bg-accent-soft/60'
          }`
        }
      >
        {!collapsed && (
          <span
            className={`w-1 shrink-0 self-stretch rounded-full ${projectColor(project.color).dot}`}
            aria-hidden="true"
          />
        )}
        {!collapsed && (
          <span
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            className="cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripIcon size={14} />
          </span>
        )}
        <span className="text-base leading-none" aria-hidden="true">
          {project.emoji}
        </span>
        {!collapsed && <span className="min-w-0 flex-1 truncate">{project.name}</span>}
        {!collapsed && (
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <Menu ariaLabel={`${project.name} options`} icon={<MoreIcon size={16} />}>
              {(close) => (
                <>
                  <MenuItem
                    onClick={() => {
                      close()
                      onEdit()
                    }}
                  >
                    <PencilIcon size={15} /> Project settings
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      close()
                      onArchive()
                    }}
                  >
                    <ArchiveIcon size={15} /> Archive
                  </MenuItem>
                  <MenuItem
                    destructive
                    onClick={() => {
                      close()
                      onDelete()
                    }}
                  >
                    <TrashIcon size={15} /> Delete
                  </MenuItem>
                </>
              )}
            </Menu>
          </span>
        )}
      </NavLink>
    </li>
  )
}

function ArchivedProjectItem({
  project,
  onUnarchive,
  onDelete,
}: {
  project: Project
  onUnarchive: () => void
  onDelete: () => void
}) {
  return (
    <li className="group relative">
      <NavLink
        to={`/project/${project.id}`}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-1 text-ui transition-colors ${
            isActive
              ? 'bg-accent-soft font-medium text-accent'
              : 'text-muted hover:bg-accent-soft/60 hover:text-ink'
          }`
        }
      >
        <span
          className={`w-1 shrink-0 self-stretch rounded-full opacity-60 ${projectColor(project.color).dot}`}
          aria-hidden="true"
        />
        <span className="text-base leading-none opacity-80" aria-hidden="true">
          {project.emoji}
        </span>
        <span className="min-w-0 flex-1 truncate">{project.name}</span>
        <span className="opacity-0 transition-opacity group-hover:opacity-100">
          <Menu ariaLabel={`${project.name} options`} icon={<MoreIcon size={16} />}>
            {(close) => (
              <>
                <MenuItem
                  onClick={() => {
                    close()
                    onUnarchive()
                  }}
                >
                  <ArchiveIcon size={15} /> Unarchive
                </MenuItem>
                <MenuItem
                  destructive
                  onClick={() => {
                    close()
                    onDelete()
                  }}
                >
                  <TrashIcon size={15} /> Delete
                </MenuItem>
              </>
            )}
          </Menu>
        </span>
      </NavLink>
    </li>
  )
}

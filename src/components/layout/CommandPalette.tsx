import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { qk } from '../../lib/queryClient'
import { listProjects } from '../../lib/api/projects'
import { listAllTasks } from '../../lib/api/tasks'
import { projectColor } from '../../lib/constants'
import {
  HomeIcon,
  LayersIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from '../ui/Icon'
import type { ReactNode } from 'react'

interface Result {
  icon: ReactNode
  label: string
  meta: string
  to: string
}

const NAV: Array<{ label: string; to: string; icon: ReactNode }> = [
  { label: 'My Work', to: '/', icon: <HomeIcon size={16} /> },
  { label: 'People', to: '/people', icon: <UsersIcon size={16} /> },
  { label: 'Teams', to: '/teams', icon: <LayersIcon size={16} /> },
  { label: 'Settings', to: '/settings', icon: <SettingsIcon size={16} /> },
]

/** Global ⌘K / Ctrl+K palette: jump to any project, task, or page. */
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  // Open with ⌘K / Ctrl+K, or a click on the sidebar Search button.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wt:open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wt:open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
    }
  }, [open])

  const projectsQuery = useQuery({ queryKey: qk.projects, queryFn: listProjects, enabled: open })
  const tasksQuery = useQuery({ queryKey: qk.allTasks, queryFn: listAllTasks, enabled: open })

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase()
    const nav: Result[] = NAV.filter((n) => !q || n.label.toLowerCase().includes(q)).map((n) => ({
      icon: n.icon,
      label: n.label,
      meta: 'Page',
      to: n.to,
    }))
    const projects: Result[] = (projectsQuery.data ?? [])
      .filter((p) => !p.is_archived && (!q || p.name.toLowerCase().includes(q)))
      .slice(0, 8)
      .map((p) => ({
        icon: (
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${projectColor(p.color).dot}`} />
            <span>{p.emoji}</span>
          </span>
        ),
        label: p.name,
        meta: 'Project',
        to: `/project/${p.id}`,
      }))
    const tasks: Result[] = q
      ? (tasksQuery.data ?? [])
          .filter((t) => t.title.toLowerCase().includes(q))
          .slice(0, 20)
          .map((t) => ({
            icon: <span>{t.project.emoji}</span>,
            label: t.title,
            meta: t.project.name,
            to: `/project/${t.project.id}/task/${t.id}`,
          }))
      : []
    return [...nav, ...projects, ...tasks]
  }, [query, projectsQuery.data, tasksQuery.data])

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(results.length - 1, s + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(0, s - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const r = results[Math.min(selected, results.length - 1)]
      if (r) go(r.to)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <div
        className="wt-animate-overlay absolute inset-0 bg-black/30"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        className="wt-animate-modal relative z-10 w-full max-w-lg overflow-hidden rounded-card border border-line bg-surface shadow-drag"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <SearchIcon size={16} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(0)
            }}
            onKeyDown={onInputKey}
            placeholder="Search projects and tasks…"
            aria-label="Search"
            autoFocus
            className="w-full bg-transparent py-3 text-ui text-ink outline-none placeholder:text-muted"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-meta text-muted">No matches.</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.to}-${i}`}
                type="button"
                onClick={() => go(r.to)}
                onMouseEnter={() => setSelected(i)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-ui transition-colors ${
                  i === selected ? 'bg-accent-soft' : ''
                }`}
              >
                <span className="shrink-0 text-muted">{r.icon}</span>
                <span className="min-w-0 flex-1 truncate text-ink">{r.label}</span>
                <span className="shrink-0 text-meta text-muted">{r.meta}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

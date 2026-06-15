import { useState } from 'react'
import { PlusIcon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'

interface QuickAddTaskProps {
  onAdd: (title: string) => Promise<void>
  placeholder?: string
}

/** Quick-add: a title is enough. Stays open after adding so you can add several. */
export function QuickAddTask({ onAdd, placeholder = 'Add a task' }: QuickAddTaskProps) {
  const [active, setActive] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const t = title.trim()
    if (!t) {
      setActive(false)
      return
    }
    try {
      setBusy(true)
      await onAdd(t)
      setTitle('')
    } catch {
      // The failure is surfaced via a toast; keep the title so it can be retried.
    } finally {
      setBusy(false)
    }
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-meta text-muted transition-colors hover:bg-paper hover:text-ink"
      >
        <PlusIcon size={15} /> {placeholder}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-surface px-2.5 py-1.5 ring-2 ring-accent/20">
      <input
        autoFocus
        value={title}
        disabled={busy}
        placeholder="Task title"
        className="w-full bg-transparent text-ui text-ink outline-none placeholder:text-muted"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void submit()
          } else if (e.key === 'Escape') {
            setTitle('')
            setActive(false)
          }
        }}
        onBlur={() => {
          if (!title.trim() && !busy) setActive(false)
        }}
      />
      {busy && <Spinner size={14} />}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface MenuProps {
  ariaLabel: string
  icon: ReactNode
  triggerClassName?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

/** A small dropdown menu (trigger + items) with outside-click and Escape close. */
export function Menu({
  ariaLabel,
  icon,
  triggerClassName = 'btn-ghost p-1',
  align = 'right',
  children,
}: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        {icon}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1 min-w-[168px] rounded-card border border-line bg-surface py-1 shadow-drag ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  onClick: () => void
  children: ReactNode
  destructive?: boolean
}

export function MenuItem({ onClick, children, destructive = false }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui transition-colors hover:bg-paper ${
        destructive ? 'text-priority-high' : 'text-ink'
      }`}
    >
      {children}
    </button>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

interface PopoverProps {
  button: ReactNode
  ariaLabel: string
  buttonClassName?: string
  align?: 'left' | 'right'
  panelClassName?: string
  children: (close: () => void) => ReactNode
}

/** A lightweight popover: arbitrary trigger content + panel, outside-click/Escape to close. */
export function Popover({
  button,
  ariaLabel,
  buttonClassName = '',
  align = 'left',
  panelClassName = '',
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Consume Escape so a parent overlay (panel/modal) doesn't also close.
        e.stopPropagation()
        setOpen(false)
      }
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
        aria-haspopup="true"
        aria-expanded={open}
        className={buttonClassName}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        {button}
      </button>
      {open && (
        <div
          className={`absolute z-50 mt-1 rounded-card border border-line bg-surface py-1 shadow-drag ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

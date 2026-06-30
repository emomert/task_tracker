import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useAnchoredPopover } from '../../hooks/useAnchoredPopover'

interface MenuProps {
  ariaLabel: string
  icon: ReactNode
  triggerClassName?: string
  align?: 'left' | 'right'
  children: (close: () => void) => ReactNode
}

/** A small dropdown menu (trigger + items), portal-rendered so it isn't clipped.
 *  Outside-click and Escape close it. */
export function Menu({
  ariaLabel,
  icon,
  triggerClassName = 'btn-ghost p-1',
  align = 'right',
  children,
}: MenuProps) {
  const { open, setOpen, triggerRef, panelRef, panelStyle } = useAnchoredPopover(align)

  return (
    <>
      <button
        ref={triggerRef}
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
      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={panelStyle}
            className="wt-animate-pop z-50 min-w-[168px] overflow-y-auto rounded-card border border-line bg-surface py-1 shadow-drag"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
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

import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { useAnchoredPopover } from '../../hooks/useAnchoredPopover'

interface PopoverProps {
  button: ReactNode
  ariaLabel: string
  buttonClassName?: string
  align?: 'left' | 'right'
  panelClassName?: string
  children: (close: () => void) => ReactNode
}

/**
 * A lightweight popover: an arbitrary trigger plus a panel that is rendered in a
 * portal with fixed positioning, so it can never be clipped by an `overflow`
 * ancestor (e.g. the table's scroll container). Outside-click / Escape close.
 */
export function Popover({
  button,
  ariaLabel,
  buttonClassName = '',
  align = 'left',
  panelClassName = '',
  children,
}: PopoverProps) {
  const { open, setOpen, triggerRef, panelRef, panelStyle } = useAnchoredPopover(align)

  return (
    <>
      <button
        ref={triggerRef}
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
      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className={`wt-animate-pop z-50 overflow-y-auto rounded-card border border-line bg-surface py-1 shadow-drag ${panelClassName}`}
          >
            {children(() => setOpen(false))}
          </div>,
          document.body,
        )}
    </>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

/**
 * Anchors a popover/menu panel to its trigger with fixed positioning, so the
 * panel can be rendered in a portal and escape any `overflow` clipping ancestor
 * (e.g. the table's horizontal-scroll wrapper, which was cutting dropdowns off).
 *
 * It flips above the trigger when there isn't room below, caps the panel height
 * to the available viewport space, re-positions on scroll/resize, and closes on
 * outside-click or Escape.
 */
export function useAnchoredPopover(align: 'left' | 'right' = 'left') {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  // Position the panel relative to the trigger using viewport coordinates.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const el = triggerRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const gap = 4
      const margin = 8
      const spaceBelow = window.innerHeight - r.bottom - margin
      const spaceAbove = r.top - margin
      const below = spaceBelow >= 220 || spaceBelow >= spaceAbove
      const style: CSSProperties = {
        position: 'fixed',
        maxHeight: Math.max(140, below ? spaceBelow : spaceAbove),
      }
      if (below) style.top = r.bottom + gap
      else style.bottom = window.innerHeight - r.top + gap
      if (align === 'right') style.right = window.innerWidth - r.right
      else style.left = r.left
      // Scale-in from the trigger corner (Emil: popovers are origin-aware).
      style.transformOrigin = `${below ? 'top' : 'bottom'} ${align === 'right' ? 'right' : 'left'}`
      setPanelStyle(style)
    }
    place()
    // capture:true so we also catch scrolls inside any ancestor container.
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, align])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Consume Escape so a parent overlay (panel/modal) doesn't also close.
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return { open, setOpen, triggerRef, panelRef, panelStyle }
}

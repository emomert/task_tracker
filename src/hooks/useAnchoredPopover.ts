import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Anchors a popover/menu panel to its trigger with fixed positioning, so the
 * panel can be rendered in a portal and escape any `overflow` clipping ancestor
 * (e.g. the table's horizontal-scroll wrapper, which was cutting dropdowns off).
 *
 * It flips above the trigger when there isn't room below, caps the panel height
 * to the available viewport space, re-positions on scroll/resize, and closes on
 * outside-click or Escape.
 */
export function useAnchoredPopover(align: 'left' | 'right' = 'left', matchWidth = false) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Whether to return focus to the trigger when the panel closes. Cleared by the
  // outside-pointer handler so clicking a different control doesn't get yanked.
  const restoreFocusRef = useRef(true)
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
      if (matchWidth) style.width = r.width
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
  }, [open, align, matchWidth])

  // Move focus into the panel when it opens (respecting anything that already
  // autofocused itself, e.g. a search input), and return focus to the trigger
  // when it closes — but only if focus is still inside the panel, so clicking a
  // different control elsewhere doesn't get its focus yanked back to the trigger.
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    // Assume we'll return focus to the trigger on close; the outside-pointer
    // handler clears this when the user clicks a different control.
    restoreFocusRef.current = true
    let raf = 0
    if (!panel.contains(document.activeElement)) {
      raf = requestAnimationFrame(() => {
        const first = panel.querySelector<HTMLElement>(FOCUSABLE)
        ;(first ?? panel).focus?.()
      })
    }
    return () => {
      if (raf) cancelAnimationFrame(raf)
      // Restore via a ref flag, NOT by querying the panel: by the time this
      // passive cleanup runs the panel node is already detached and focus has
      // fallen to <body>, so `panel.contains(activeElement)` would always be
      // false and the trigger would never get focus back.
      if (restoreFocusRef.current) triggerRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) {
        // Clicked a different control — let it keep focus instead of restoring
        // to the trigger.
        restoreFocusRef.current = false
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Consume Escape so a parent overlay (panel/modal) doesn't also close.
        e.stopPropagation()
        setOpen(false)
        return
      }
      // Roving focus among the panel's items (Notion-style menus/listboxes).
      // Skip when a text field is focused so arrows still move the caret / filter.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
        const panel = panelRef.current
        if (!panel) return
        const ae = document.activeElement as HTMLElement | null
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
          return
        }
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (n) => n.offsetParent !== null,
        )
        if (items.length === 0) return
        e.preventDefault()
        const idx = ae ? items.indexOf(ae) : -1
        let next: number
        if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = items.length - 1
        else if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % items.length
        else next = idx <= 0 ? items.length - 1 : idx - 1
        items[next]?.focus()
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

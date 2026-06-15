import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Keeps keyboard focus inside `ref` while `active`. On activate: move focus in
 * (unless something inside is already focused, e.g. an autoFocus input). On
 * deactivate: restore focus to wherever it was. Traps Tab / Shift+Tab.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  opts: { focusContainer?: boolean } = {},
) {
  const { focusContainer = false } = opts
  useEffect(() => {
    if (!active) return
    const el = ref.current
    if (!el) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      )

    if (!el.contains(document.activeElement)) {
      // Focus the container itself when asked (avoids grabbing the first input),
      // otherwise move focus to the first focusable element.
      const target = focusContainer ? el : (focusables()[0] ?? el)
      target.focus?.()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const activeEl = document.activeElement
      if (e.shiftKey) {
        if (activeEl === first || !el.contains(activeEl)) {
          e.preventDefault()
          last.focus()
        }
      } else if (activeEl === last || !el.contains(activeEl)) {
        e.preventDefault()
        first.focus()
      }
    }

    el.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('keydown', onKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [ref, active, focusContainer])
}

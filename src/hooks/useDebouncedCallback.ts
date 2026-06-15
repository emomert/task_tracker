import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a debounced version of `fn` plus a `flush` to run it immediately.
 * Used for the editor's ~1s autosave. The latest args win.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): { call: (...args: Args) => void; flush: () => void; cancel: () => void } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgs = useRef<Args | null>(null)
  const fnRef = useRef(fn)

  // Keep the latest function without resetting the timer.
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const flush = useCallback(() => {
    if (timer.current && pendingArgs.current) {
      clear()
      const args = pendingArgs.current
      pendingArgs.current = null
      fnRef.current(...args)
    }
  }, [clear])

  const cancel = useCallback(() => {
    clear()
    pendingArgs.current = null
  }, [clear])

  const call = useCallback(
    (...args: Args) => {
      pendingArgs.current = args
      clear()
      timer.current = setTimeout(() => {
        timer.current = null
        const a = pendingArgs.current
        pendingArgs.current = null
        if (a) fnRef.current(...a)
      }, delayMs)
    },
    [clear, delayMs],
  )

  // Flush nothing on unmount, but always clear the timer to avoid leaks.
  useEffect(() => clear, [clear])

  return { call, flush, cancel }
}

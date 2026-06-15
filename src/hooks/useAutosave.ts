import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from './useDebouncedCallback'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Debounced autosave with durability and single-flight write ordering:
 * - tracks the last successfully-saved value, so identical content is never re-saved;
 * - only ONE save runs at a time; newer edits queue and are written last, so an
 *   in-flight slow save can never overwrite a newer value (no stale clobber);
 * - retries with a backoff on failure instead of dropping the edit;
 * - flushes the latest unsaved value through the same queue on unmount, and warns
 *   via beforeunload while there is unsaved content;
 * - never reports state after unmount.
 */
export function useAutosave(
  initial: string,
  save: (value: string) => Promise<void>,
  delayMs = 1000,
) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const lastSaved = useRef(initial)
  const latest = useRef(initial)
  const pending = useRef<string | null>(null) // newest value awaiting a write
  const running = useRef(false)
  const saveRef = useRef(save)
  const mounted = useRef(true)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    saveRef.current = save
  }, [save])

  const setStatusSafe = useCallback((s: SaveStatus) => {
    if (mounted.current) setStatus(s)
  }, [])

  // The single-flight saver. Stored in a ref so debounce/retry/unmount all drive
  // the same instance and writes are serialized.
  const pumpRef = useRef<() => Promise<void>>(async () => {})
  pumpRef.current = async () => {
    if (running.current) return // a write is already in flight; it'll pick up `pending`
    running.current = true
    try {
      while (pending.current !== null && pending.current !== lastSaved.current) {
        const value = pending.current
        pending.current = null
        setStatusSafe('saving')
        try {
          await saveRef.current(value)
          lastSaved.current = value
        } catch (err) {
          console.error('Autosave failed:', err)
          setStatusSafe('error')
          // Keep the value for retry unless something newer already arrived.
          if (pending.current === null) pending.current = value
          if (retryTimer.current) clearTimeout(retryTimer.current)
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null
            void pumpRef.current()
          }, 4000)
          return
        }
      }
      if (pending.current === null && latest.current === lastSaved.current) {
        setStatusSafe('saved')
      }
    } finally {
      running.current = false
    }
  }

  const { call } = useDebouncedCallback(() => {
    void pumpRef.current()
  }, delayMs)

  const onChange = useCallback(
    (value: string) => {
      latest.current = value
      if (value !== lastSaved.current) {
        pending.current = value
        setStatusSafe('saving')
        call()
      } else {
        // Reverted to the saved content — nothing to write.
        pending.current = null
        setStatusSafe('saved')
      }
    },
    [call, setStatusSafe],
  )

  // Mount/unmount lifecycle (StrictMode-safe) + navigation safety net.
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (retryTimer.current) clearTimeout(retryTimer.current)
      // Queue the latest unsaved value and flush it through the single-flight
      // pump so it can never race an in-flight save.
      if (latest.current !== lastSaved.current) {
        pending.current = latest.current
        void pumpRef.current()
      }
    }
  }, [])

  // Warn before closing/refreshing the tab if there's unsaved content.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (latest.current !== lastSaved.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return { status, onChange }
}

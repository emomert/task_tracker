import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from './Icon'

type ToastKind = 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// Module-level monotonic id (no Date.now needed).
let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++nextId
      setToasts((list) => [...list, { id, message, kind }])
      window.setTimeout(() => remove(id), 5000)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              className={`wt-animate-toast pointer-events-auto flex items-start gap-2 rounded-card border bg-surface px-3 py-2 text-ui text-ink shadow-drag ${
                t.kind === 'error' ? 'border-priority-high/40' : 'border-line'
              }`}
            >
              {t.kind === 'error' && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-priority-high" />
              )}
              <span className="max-w-xs">{t.message}</span>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="btn-ghost -mr-1 -mt-0.5 p-0.5"
                aria-label="Dismiss"
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

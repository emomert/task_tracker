import { Spinner } from '../ui/Spinner'
import { CheckIcon } from '../ui/Icon'
import type { SaveStatus } from '../../hooks/useAutosave'

const TEXT: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: "Couldn't save",
}

/** A gentle saving/saved indicator (see the "Signature" note in 04-design.md). */
export function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <span
      aria-live="polite"
      className={`inline-flex select-none items-center gap-1.5 text-meta transition-opacity duration-300 ${
        status === 'idle' ? 'opacity-0' : 'opacity-100'
      } ${status === 'error' ? 'text-danger' : 'text-muted'}`}
    >
      {status === 'saving' && <Spinner size={12} />}
      {status === 'saved' && <CheckIcon size={13} />}
      {TEXT[status]}
    </span>
  )
}

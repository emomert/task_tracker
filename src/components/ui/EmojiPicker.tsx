import { useEffect, useRef, useState } from 'react'

// A curated spread — enough variety for projects and people without a heavy
// emoji dependency. The free-text field accepts any emoji you can type/paste.
const EMOJIS = [
  '📁', '📂', '🗂️', '📋', '📝', '📌', '📎', '🗒️',
  '🚀', '✨', '🔥', '⚡', '🌱', '🌟', '🎯', '🏁',
  '💡', '🧩', '🛠️', '⚙️', '🔧', '🧪', '🔬', '📐',
  '📊', '📈', '📉', '💰', '🧾', '🏷️', '🗃️', '📦',
  '🎨', '🖌️', '🖼️', '🎬', '🎵', '📷', '✏️', '🪄',
  '🧠', '🤝', '💬', '📣', '🔔', '🗓️', '⏰', '✅',
  '🐛', '🧱', '🌐', '🔒', '🗝️', '🧭', '🚦', '🛰️',
  '🙂', '😀', '😎', '🤓', '🧑‍💻', '👩‍🎨', '👨‍🔧', '🦊',
  '🐙', '🐳', '🦉', '🐝', '🌈', '☕', '🍀', '⭐',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  /** Visual size of the trigger button. */
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
}

const SIZE_CLASS: Record<NonNullable<EmojiPickerProps['size']>, string> = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-xl',
  lg: 'h-14 w-14 text-3xl',
}

export function EmojiPicker({
  value,
  onChange,
  size = 'md',
  ariaLabel = 'Pick an emoji',
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // Consume Escape so a parent modal doesn't also close (losing unsaved input).
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

  function pick(emoji: string) {
    const trimmed = emoji.trim()
    if (trimmed) onChange([...trimmed][0] ?? trimmed)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`flex items-center justify-center rounded-md border border-line bg-surface transition-colors hover:bg-paper ${SIZE_CLASS[size]}`}
      >
        <span aria-hidden="true">{value || '🙂'}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-card border border-line bg-surface p-2 shadow-drag">
          <div className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => pick(e)}
                aria-label={e}
                aria-pressed={e === value}
                className={`flex h-7 w-7 items-center justify-center rounded text-lg transition-colors hover:bg-accent-soft ${
                  e === value ? 'bg-accent-soft' : ''
                }`}
              >
                <span aria-hidden="true">{e}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 border-t border-line pt-2">
            <input
              type="text"
              defaultValue={value}
              placeholder="Or type any emoji"
              aria-label="Type any emoji"
              className="input-field py-1.5 text-ui"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  pick((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

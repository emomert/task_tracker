import type { ReactNode } from 'react'
import { Popover } from './Popover'
import { CheckIcon, ChevronDownIcon } from './Icon'

export interface SelectOption {
  value: string
  label: string
  icon?: ReactNode
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel: string
}

/** A themed dropdown that matches the status/priority pickers (replaces native <select>). */
export function Select({ value, onChange, options, placeholder = 'Select…', ariaLabel }: SelectProps) {
  const selected = options.find((o) => o.value === value)
  return (
    <Popover
      ariaLabel={ariaLabel}
      matchTriggerWidth
      buttonClassName="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 py-2 text-ui text-ink outline-none transition-colors hover:bg-paper focus-visible:border-accent"
      button={
        <>
          <span className="inline-flex min-w-0 items-center gap-2">
            {selected?.icon}
            <span className={`truncate ${selected ? 'text-ink' : 'text-muted'}`}>
              {selected ? selected.label : placeholder}
            </span>
          </span>
          <ChevronDownIcon size={14} className="shrink-0 text-muted" />
        </>
      }
    >
      {(close) =>
        options.length === 0 ? (
          <p className="px-3 py-2 text-meta text-muted">No options.</p>
        ) : (
          options.map((o) => (
            <button
              key={o.value || '__empty__'}
              type="button"
              onClick={() => {
                onChange(o.value)
                close()
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui text-ink transition-colors hover:bg-paper"
            >
              {o.icon}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.value === value && <CheckIcon size={14} className="shrink-0 text-accent" />}
            </button>
          ))
        )
      }
    </Popover>
  )
}

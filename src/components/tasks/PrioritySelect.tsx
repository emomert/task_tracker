import { Popover } from '../ui/Popover'
import { PriorityMarker } from '../ui/PriorityMarker'
import { CheckIcon, ChevronDownIcon } from '../ui/Icon'
import { PRIORITIES } from '../../lib/constants'
import type { TaskPriority } from '../../types'

interface PrioritySelectProps {
  value: TaskPriority | null
  onChange: (priority: TaskPriority | null) => void
}

export function PrioritySelect({ value, onChange }: PrioritySelectProps) {
  return (
    <Popover
      ariaLabel="Change priority"
      panelClassName="min-w-[150px]"
      buttonClassName="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-ui transition-colors hover:border-line hover:bg-paper"
      button={
        <>
          {value ? (
            <PriorityMarker priority={value} />
          ) : (
            <span className="text-muted">No priority</span>
          )}
          <ChevronDownIcon size={14} className="text-muted" />
        </>
      }
    >
      {(close) => (
        <>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              close()
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui text-muted transition-colors hover:bg-paper"
          >
            <span className="flex-1">No priority</span>
            {value == null && <CheckIcon size={14} className="text-accent" />}
          </button>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => {
                onChange(p.value)
                close()
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui transition-colors hover:bg-paper"
            >
              <PriorityMarker priority={p.value} />
              <span className="flex-1" />
              {value === p.value && <CheckIcon size={14} className="text-accent" />}
            </button>
          ))}
        </>
      )}
    </Popover>
  )
}

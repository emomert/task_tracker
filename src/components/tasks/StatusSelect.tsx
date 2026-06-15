import { Popover } from '../ui/Popover'
import { StatusDot } from '../ui/StatusBadge'
import { CheckIcon, ChevronDownIcon } from '../ui/Icon'
import { STATUSES, STATUS_BY_VALUE } from '../../lib/constants'
import type { TaskStatus } from '../../types'

interface StatusSelectProps {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
  /** Show only the dot (no label) — for tight rows. */
  compact?: boolean
}

export function StatusSelect({ value, onChange, compact = false }: StatusSelectProps) {
  const current = STATUS_BY_VALUE[value]
  return (
    <Popover
      ariaLabel="Change status"
      panelClassName="min-w-[170px]"
      buttonClassName="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-ui text-ink transition-colors hover:border-line hover:bg-paper"
      button={
        <>
          <StatusDot status={value} />
          {!compact && <span>{current.label}</span>}
          <ChevronDownIcon size={14} className="text-muted" />
        </>
      }
    >
      {(close) =>
        STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              onChange(s.value)
              close()
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui transition-colors hover:bg-paper"
          >
            <StatusDot status={s.value} />
            <span className="flex-1">{s.label}</span>
            {s.value === value && <CheckIcon size={14} className="text-accent" />}
          </button>
        ))
      }
    </Popover>
  )
}

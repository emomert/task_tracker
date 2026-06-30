import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { Popover } from './Popover'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './Icon'

interface DatePickerProps {
  /** ISO date 'YYYY-MM-DD' or null. */
  value: string | null
  onChange: (value: string | null) => void
  ariaLabel?: string
  /** Override the trigger's styling (e.g. a subtler look inside a table). */
  buttonClassName?: string
}

const DEFAULT_TRIGGER =
  'inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-ui text-ink transition-colors hover:bg-paper'

/** A calendar popover for picking a date — replaces the native date input. */
export function DatePicker({
  value,
  onChange,
  ariaLabel = 'Set date',
  buttonClassName = DEFAULT_TRIGGER,
}: DatePickerProps) {
  const selected = value ? parseISO(value) : null
  return (
    <Popover
      ariaLabel={ariaLabel}
      panelClassName="w-64"
      buttonClassName={buttonClassName}
      button={
        value ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-muted" />
            {format(parseISO(value), 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <CalendarIcon size={14} /> Set date
          </span>
        )
      }
    >
      {(close) => (
        <Calendar
          selected={selected}
          onPick={(d) => {
            onChange(d ? format(d, 'yyyy-MM-dd') : null)
            close()
          }}
        />
      )}
    </Popover>
  )
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function Calendar({
  selected,
  onPick,
}: {
  selected: Date | null
  onPick: (d: Date | null) => void
}) {
  const [month, setMonth] = useState<Date>(startOfMonth(selected ?? startOfToday()))
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  })

  return (
    <div className="px-1.5 pb-1">
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          className="btn-ghost p-1"
          aria-label="Previous month"
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="text-ui font-medium text-ink">{format(month, 'MMMM yyyy')}</span>
        <button
          type="button"
          className="btn-ghost p-1"
          aria-label="Next month"
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DOW.map((d, i) => (
          <span key={i} className="py-1 text-[11px] font-medium text-muted">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const isSel = selected && isSameDay(day, selected)
          const today = isToday(day)
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onPick(day)}
              className={`flex h-8 items-center justify-center rounded-md text-ui transition-colors ${
                isSel
                  ? 'bg-accent font-medium text-white'
                  : today
                    ? 'font-semibold text-accent hover:bg-accent-soft'
                    : inMonth
                      ? 'text-ink hover:bg-accent-soft'
                      : 'text-muted/60 hover:bg-accent-soft'
              }`}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button
          type="button"
          className="text-meta text-accent hover:underline"
          onClick={() => onPick(startOfToday())}
        >
          Today
        </button>
        {selected && (
          <button
            type="button"
            className="text-meta text-muted hover:text-ink hover:underline"
            onClick={() => onPick(null)}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

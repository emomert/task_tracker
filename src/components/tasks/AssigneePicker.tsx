import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Popover } from '../ui/Popover'
import { Avatar, displayName } from '../ui/Avatar'
import { AssigneeChips } from '../ui/AssigneeChips'
import { CheckIcon } from '../ui/Icon'
import { Spinner } from '../ui/Spinner'
import { qk } from '../../lib/queryClient'
import { listProfiles } from '../../lib/api/profiles'
import type { Profile } from '../../types'

interface AssigneePickerProps {
  value: Profile[]
  onChange: (people: Profile[]) => void
  placeholder?: string
}

/** Multi-select of people. The pool is everyone who has signed up (profiles). */
export function AssigneePicker({ value, onChange, placeholder = 'Assign…' }: AssigneePickerProps) {
  const peopleQuery = useQuery({ queryKey: qk.profiles, queryFn: listProfiles })
  const selected = new Set(value.map((v) => v.id))

  // Track the latest selection in a ref and advance it on every toggle, so two
  // quick clicks (before the optimistic update flows back into `value`) don't
  // each compute from a stale list and clobber one another's pick.
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  function toggle(person: Profile) {
    const current = valueRef.current
    const next = current.some((v) => v.id === person.id)
      ? current.filter((v) => v.id !== person.id)
      : [...current, person]
    valueRef.current = next
    onChange(next)
  }

  return (
    <Popover
      ariaLabel="Assign people"
      panelClassName="w-60"
      buttonClassName="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-transparent px-2 py-1 text-ui transition-colors hover:border-line hover:bg-paper"
      button={<AssigneeChips people={value} max={4} placeholder={placeholder} />}
    >
      {() => {
        if (peopleQuery.isLoading) {
          return (
            <div className="flex justify-center py-3">
              <Spinner size={16} />
            </div>
          )
        }
        if (peopleQuery.isError) {
          return (
            <p className="px-3 py-2 text-meta text-priority-high">
              Couldn't load people. Try again.
            </p>
          )
        }
        const people = peopleQuery.data ?? []
        if (people.length === 0) {
          return <p className="px-3 py-2 text-meta text-muted">No people yet.</p>
        }
        return people.map((person) => {
          const isSelected = selected.has(person.id)
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => toggle(person)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ui transition-colors hover:bg-paper"
            >
              <Avatar profile={person} size="sm" />
              <span className="min-w-0 flex-1 truncate">{displayName(person)}</span>
              {isSelected && <CheckIcon size={15} className="text-accent" />}
            </button>
          )
        })
      }}
    </Popover>
  )
}

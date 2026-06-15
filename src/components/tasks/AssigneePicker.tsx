import { useQuery } from '@tanstack/react-query'
import { Popover } from '../ui/Popover'
import { Avatar, AvatarStack, displayName } from '../ui/Avatar'
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

  function toggle(person: Profile) {
    if (selected.has(person.id)) {
      onChange(value.filter((v) => v.id !== person.id))
    } else {
      onChange([...value, person])
    }
  }

  return (
    <Popover
      ariaLabel="Assign people"
      panelClassName="w-60 max-h-72 overflow-y-auto"
      buttonClassName="inline-flex min-h-[28px] items-center gap-1 rounded-md border border-transparent px-2 py-1 text-ui transition-colors hover:border-line hover:bg-paper"
      button={
        value.length > 0 ? (
          <AvatarStack people={value} size="sm" max={4} />
        ) : (
          <span className="text-meta text-muted">{placeholder}</span>
        )
      }
    >
      {() => {
        if (peopleQuery.isLoading) {
          return (
            <div className="flex justify-center py-3">
              <Spinner size={16} />
            </div>
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

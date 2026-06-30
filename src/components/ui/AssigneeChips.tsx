import type { Profile } from '../../types'
import { displayName } from './Avatar'

type ChipPerson = Pick<Profile, 'emoji' | 'full_name' | 'email'>

interface AssigneeChipsProps {
  people: ChipPerson[]
  max?: number
  placeholder?: string
}

/** Assignees shown as emoji + name chips (more legible than bare avatars). */
export function AssigneeChips({ people, max = 3, placeholder }: AssigneeChipsProps) {
  if (people.length === 0) {
    return placeholder ? <span className="text-meta text-muted">{placeholder}</span> : null
  }
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((p, i) => (
        <span
          key={i}
          className="inline-flex max-w-[150px] items-center gap-1 rounded-full border border-line bg-paper px-1.5 py-0.5 text-meta text-ink"
        >
          <span aria-hidden="true">{p.emoji || '🙂'}</span>
          <span className="truncate">{displayName(p)}</span>
        </span>
      ))}
      {extra > 0 && (
        <span className="text-meta text-muted" title={people.map(displayName).join(', ')}>
          +{extra}
        </span>
      )}
    </span>
  )
}

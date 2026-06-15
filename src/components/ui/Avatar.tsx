import type { Profile } from '../../types'

type AvatarProfile = Pick<Profile, 'emoji' | 'full_name' | 'email'>

interface AvatarProps {
  profile: AvatarProfile
  size?: 'xs' | 'sm' | 'md'
}

const SIZE_CLASS: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-5 w-5 text-[11px]',
  sm: 'h-6 w-6 text-sm',
  md: 'h-8 w-8 text-base',
}

export function displayName(p: AvatarProfile): string {
  return p.full_name?.trim() || p.email?.split('@')[0] || 'Someone'
}

function initials(p: AvatarProfile): string {
  const name = displayName(p)
  const parts = name.split(/\s+/).filter(Boolean)
  const letters = parts.slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '')
  return letters.join('') || '?'
}

/** A person's emoji avatar, falling back to initials. */
export function Avatar({ profile, size = 'sm' }: AvatarProps) {
  const name = displayName(profile)
  return (
    <span
      title={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-paper ${SIZE_CLASS[size]}`}
    >
      {profile.emoji ? (
        <span aria-hidden="true">{profile.emoji}</span>
      ) : (
        <span className="font-medium text-muted">{initials(profile)}</span>
      )}
    </span>
  )
}

/** A small overlapping stack of assignee avatars, with a +N overflow. */
export function AvatarStack({
  people,
  max = 3,
  size = 'sm',
}: {
  people: AvatarProfile[]
  max?: number
  size?: AvatarProps['size']
}) {
  if (people.length === 0) return null
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((p, i) => (
        <span key={i} className="ring-2 ring-surface rounded-full">
          <Avatar profile={p} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span className="ml-2 text-meta text-muted" title={people.map(displayName).join(', ')}>
          +{extra}
        </span>
      )}
    </span>
  )
}

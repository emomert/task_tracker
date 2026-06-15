import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { qk } from '../lib/queryClient'
import { listProfiles, updateProfile } from '../lib/api/profiles'
import { DEFAULT_PERSON_EMOJI } from '../lib/constants'
import type { Profile } from '../types'
import { Avatar, displayName } from '../components/ui/Avatar'
import { EmojiPicker } from '../components/ui/EmojiPicker'
import { Modal } from '../components/ui/Modal'
import { Spinner, LoadingArea } from '../components/ui/Spinner'
import { ErrorState, errorMessage } from '../components/ui/ErrorState'
import { PencilIcon } from '../components/ui/Icon'

export function PeoplePage() {
  const peopleQuery = useQuery({ queryKey: qk.profiles, queryFn: listProfiles })
  const [editing, setEditing] = useState<Profile | null>(null)

  if (peopleQuery.isLoading) return <LoadingArea />
  if (peopleQuery.isError) return <ErrorState onRetry={() => peopleQuery.refetch()} />

  const people = peopleQuery.data ?? []

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <h1 className="text-title font-semibold text-ink">People</h1>
      <p className="mt-1 text-ui text-muted">
        Everyone on the team. Anyone can update a person's name, role, or emoji.
      </p>

      <div className="mt-6 overflow-hidden rounded-card border border-line bg-surface">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-accent-soft/40"
          >
            <Avatar profile={person} size="md" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-ui font-medium text-ink">{displayName(person)}</div>
              <div className="truncate text-meta text-muted">{person.email}</div>
            </div>
            <div className="hidden w-40 truncate text-ui text-muted sm:block">
              {person.role || <span className="text-muted">No role yet</span>}
            </div>
            <button
              type="button"
              className="btn-ghost p-1.5"
              aria-label={`Edit ${displayName(person)}`}
              onClick={() => setEditing(person)}
            >
              <PencilIcon size={16} />
            </button>
          </div>
        ))}
      </div>

      {people.length <= 1 && (
        <p className="mt-4 text-ui text-muted">
          It's just you so far. Teammates appear here once they sign up.
        </p>
      )}

      <PersonEditModal person={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function PersonEditModal({ person, onClose }: { person: Profile | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_PERSON_EMOJI)

  useEffect(() => {
    if (person) {
      setFullName(person.full_name ?? '')
      setRole(person.role ?? '')
      setEmoji(person.emoji || DEFAULT_PERSON_EMOJI)
    }
  }, [person])

  const save = useMutation({
    mutationFn: () =>
      updateProfile(person!.id, {
        full_name: fullName.trim() || null,
        role: role.trim() || null,
        emoji,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profiles })
      onClose()
    },
  })

  return (
    <Modal
      open={person != null}
      onClose={onClose}
      title="Edit person"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending && <Spinner size={14} className="border-white/40 border-t-white" />}
            Save changes
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div>
          <label className="field-label mb-1.5">Emoji</label>
          <EmojiPicker value={emoji} onChange={setEmoji} size="lg" ariaLabel="Person emoji" />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label htmlFor="person-name" className="field-label mb-1.5">
              Full name
            </label>
            <input
              id="person-name"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="person-role" className="field-label mb-1.5">
              Role
            </label>
            <input
              id="person-role"
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Designer, PM"
            />
          </div>
        </div>
      </div>
      {save.isError && (
        <p className="mt-3 text-meta text-priority-high">{errorMessage(save.error)}</p>
      )}
    </Modal>
  )
}

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { qk } from '../lib/queryClient'
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  listTeamMemberships,
  listTeams,
  removeTeamMember,
} from '../lib/api/teams'
import { listProfiles } from '../lib/api/profiles'
import type { Profile } from '../types'
import { Avatar, displayName } from '../components/ui/Avatar'
import { LoadingArea } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import { PlusIcon, TrashIcon, XIcon } from '../components/ui/Icon'

export function TeamsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { notify } = useToast()

  const teamsQuery = useQuery({ queryKey: qk.teams, queryFn: listTeams })
  const membersQuery = useQuery({ queryKey: qk.teamMembers, queryFn: listTeamMemberships })
  const peopleQuery = useQuery({ queryKey: qk.profiles, queryFn: listProfiles })

  const me = peopleQuery.data?.find((p) => p.id === user?.id) ?? null
  const isAdmin = me?.is_admin ?? false

  const [newName, setNewName] = useState('')
  const [deletingTeam, setDeletingTeam] = useState<{ id: string; name: string } | null>(null)

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: qk.teams })
    queryClient.invalidateQueries({ queryKey: qk.teamMembers })
    // Membership changes affect which projects are visible.
    queryClient.invalidateQueries({ queryKey: qk.projects })
  }

  const createMut = useMutation({
    mutationFn: (name: string) => createTeam(name),
    onSuccess: () => {
      setNewName('')
      invalidateAll()
    },
    onError: () => notify("Couldn't create the team. Check your connection and try again.", 'error'),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: invalidateAll,
    onError: () => notify("Couldn't delete the team. Check your connection and try again.", 'error'),
  })
  const addMut = useMutation({
    mutationFn: (v: { teamId: string; profileId: string }) => addTeamMember(v.teamId, v.profileId),
    onSuccess: invalidateAll,
    onError: () => notify("Couldn't add the member. Check your connection and try again.", 'error'),
  })
  const removeMut = useMutation({
    mutationFn: (v: { teamId: string; profileId: string }) =>
      removeTeamMember(v.teamId, v.profileId),
    onSuccess: invalidateAll,
    onError: () => notify("Couldn't remove the member. Check your connection and try again.", 'error'),
  })

  if (teamsQuery.isLoading || membersQuery.isLoading || peopleQuery.isLoading) {
    return <LoadingArea />
  }
  if (teamsQuery.isError) return <ErrorState onRetry={() => teamsQuery.refetch()} />

  const teams = teamsQuery.data ?? []
  const memberships = membersQuery.data ?? []
  const people = peopleQuery.data ?? []

  const membersByTeam = new Map<string, Profile[]>()
  for (const m of memberships) {
    const arr = membersByTeam.get(m.team_id) ?? []
    arr.push(m.profile)
    membersByTeam.set(m.team_id, arr)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 md:px-8">
      <h1 className="text-title font-semibold text-ink">Teams</h1>
      <p className="mt-1 text-ui text-muted">
        Projects belong to a team — only its members (and admins) can see them.
        {isAdmin
          ? ' As an admin you can create teams and manage who is on them.'
          : ' You can join or leave teams here.'}
      </p>

      {isAdmin && (
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const n = newName.trim()
            if (n) createMut.mutate(n)
          }}
        >
          <input
            className="input-field"
            placeholder="New team name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={createMut.isPending || !newName.trim()}
          >
            <PlusIcon size={16} /> Create
          </button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {teams.length === 0 ? (
          <p className="text-ui text-muted">No teams yet.{isAdmin ? ' Create one above.' : ''}</p>
        ) : (
          teams.map((team) => {
            const members = membersByTeam.get(team.id) ?? []
            const iAmMember = members.some((p) => p.id === user?.id)
            const nonMembers = people.filter((p) => !members.some((m) => m.id === p.id))
            return (
              <div key={team.id} className="rounded-card border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-ui font-semibold text-ink">{team.name}</h2>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        iAmMember
                          ? removeMut.mutate({ teamId: team.id, profileId: user!.id })
                          : addMut.mutate({ teamId: team.id, profileId: user!.id })
                      }
                    >
                      {iAmMember ? 'Leave' : 'Join'}
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn-ghost p-1.5 text-priority-high"
                        aria-label={`Delete ${team.name}`}
                        onClick={() => setDeletingTeam({ id: team.id, name: team.name })}
                      >
                        <TrashIcon size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {members.length === 0 ? (
                    <span className="text-meta text-muted">No members yet.</span>
                  ) : (
                    members.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper py-0.5 pl-1 pr-2 text-meta text-ink"
                      >
                        <Avatar profile={p} size="xs" />
                        {displayName(p)}
                        {isAdmin && (
                          <button
                            type="button"
                            aria-label={`Remove ${displayName(p)} from ${team.name}`}
                            className="text-muted transition-colors hover:text-priority-high"
                            onClick={() => removeMut.mutate({ teamId: team.id, profileId: p.id })}
                          >
                            <XIcon size={12} />
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {isAdmin && nonMembers.length > 0 && (
                  <div className="mt-3">
                    <select
                      className="input-field max-w-xs text-ui"
                      value=""
                      aria-label={`Add a member to ${team.name}`}
                      onChange={(e) => {
                        if (e.target.value) addMut.mutate({ teamId: team.id, profileId: e.target.value })
                      }}
                    >
                      <option value="">Add a member…</option>
                      {nonMembers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {displayName(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <ConfirmDialog
        open={deletingTeam != null}
        title="Delete team"
        message={
          deletingTeam
            ? `Delete “${deletingTeam.name}”? Its projects will lose their team and become visible to everyone.`
            : ''
        }
        confirmLabel="Delete team"
        destructive
        onCancel={() => setDeletingTeam(null)}
        onConfirm={async () => {
          if (deletingTeam) await deleteMut.mutateAsync(deletingTeam.id)
          setDeletingTeam(null)
        }}
      />
    </div>
  )
}

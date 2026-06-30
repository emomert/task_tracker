import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { EmojiPicker } from '../ui/EmojiPicker'
import { Select } from '../ui/Select'
import { errorMessage } from '../ui/ErrorState'
import { CheckIcon } from '../ui/Icon'
import { DEFAULT_PROJECT_EMOJI, PROJECT_COLORS } from '../../lib/constants'
import { qk } from '../../lib/queryClient'
import { listTeams } from '../../lib/api/teams'

interface ProjectFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialName?: string
  initialEmoji?: string
  initialColor?: string
  initialTeamId?: string | null
  initialBrief?: string | null
  onSubmit: (values: {
    name: string
    emoji: string
    color: string
    team_id: string | null
    brief: string | null
  }) => Promise<void>
  onClose: () => void
}

export function ProjectFormModal({
  open,
  mode,
  initialName = '',
  initialEmoji = DEFAULT_PROJECT_EMOJI,
  initialColor = 'neutral',
  initialTeamId = null,
  initialBrief = null,
  onSubmit,
  onClose,
}: ProjectFormModalProps) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [color, setColor] = useState(initialColor)
  const [teamId, setTeamId] = useState<string | null>(initialTeamId)
  const [brief, setBrief] = useState(initialBrief ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teamsQuery = useQuery({ queryKey: qk.teams, queryFn: listTeams, enabled: open })
  const teams = teamsQuery.data ?? []

  // Reset fields each time the modal opens.
  useEffect(() => {
    if (open) {
      setName(initialName)
      setEmoji(initialEmoji)
      setColor(initialColor)
      setTeamId(initialTeamId)
      setBrief(initialBrief ?? '')
      setError(null)
    }
  }, [open, initialName, initialEmoji, initialColor, initialTeamId, initialBrief])

  // A brand-new project defaults to the first available team.
  useEffect(() => {
    if (open && mode === 'create' && initialTeamId == null && teamId == null && teams.length > 0) {
      setTeamId(teams[0].id)
    }
  }, [open, mode, initialTeamId, teamId, teams])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the project a name.')
      return
    }
    try {
      setBusy(true)
      setError(null)
      await onSubmit({ name: trimmed, emoji, color, team_id: teamId, brief: brief.trim() || null })
      onClose()
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the project."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={mode === 'create' ? 'New project' : 'Project settings'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={busy}>
            {busy && <Spinner size={14} className="border-white/40 border-t-white" />}
            {mode === 'create' ? 'Create project' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div>
          <label className="field-label mb-1.5">Emoji</label>
          <EmojiPicker value={emoji} onChange={setEmoji} size="lg" ariaLabel="Project emoji" />
        </div>
        <div className="flex-1">
          <label htmlFor="project-name" className="field-label mb-1.5">
            Name
          </label>
          <input
            id="project-name"
            className="input-field"
            value={name}
            autoFocus
            placeholder="e.g. Website redesign"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSubmit()
              }
            }}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label mb-1.5">Color</label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setColor(c.key)}
              aria-label={c.label}
              aria-pressed={color === c.key}
              title={c.label}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95 ${c.dot} ${
                color === c.key ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
              }`}
            >
              {color === c.key && <CheckIcon size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="field-label mb-1.5">Team</label>
        <Select
          ariaLabel="Team"
          value={teamId ?? ''}
          onChange={(v) => setTeamId(v || null)}
          options={[
            { value: '', label: 'No team (everyone can see it)' },
            ...teams.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <p className="mt-1 text-meta text-muted">
          Only members of the team can see this project.
        </p>
      </div>

      <div className="mt-4">
        <label htmlFor="project-brief" className="field-label mb-1.5">
          Brief
        </label>
        <textarea
          id="project-brief"
          className="input-field min-h-[60px] resize-y"
          rows={2}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="A short description, shown in the project's side panel."
        />
      </div>

      {error && <p className="mt-3 text-meta text-priority-high">{error}</p>}
    </Modal>
  )
}

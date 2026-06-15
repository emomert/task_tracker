import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Spinner } from '../ui/Spinner'
import { EmojiPicker } from '../ui/EmojiPicker'
import { errorMessage } from '../ui/ErrorState'
import { DEFAULT_PROJECT_EMOJI } from '../../lib/constants'

interface ProjectFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  initialName?: string
  initialEmoji?: string
  onSubmit: (values: { name: string; emoji: string }) => Promise<void>
  onClose: () => void
}

export function ProjectFormModal({
  open,
  mode,
  initialName = '',
  initialEmoji = DEFAULT_PROJECT_EMOJI,
  onSubmit,
  onClose,
}: ProjectFormModalProps) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset fields each time the modal opens.
  useEffect(() => {
    if (open) {
      setName(initialName)
      setEmoji(initialEmoji)
      setError(null)
    }
  }, [open, initialName, initialEmoji])

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give the project a name.')
      return
    }
    try {
      setBusy(true)
      setError(null)
      await onSubmit({ name: trimmed, emoji })
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
      {error && <p className="mt-3 text-meta text-priority-high">{error}</p>}
    </Modal>
  )
}

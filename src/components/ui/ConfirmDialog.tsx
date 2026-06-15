import { useState } from 'react'
import { Modal } from './Modal'
import { Spinner } from './Spinner'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    try {
      setBusy(true)
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={
              destructive
                ? 'inline-flex items-center justify-center gap-2 rounded-md bg-priority-high px-3 py-1.5 text-ui font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50'
                : 'btn-primary'
            }
          >
            {busy && <Spinner size={14} className="border-white/40 border-t-white" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-ui text-muted">{message}</p>
    </Modal>
  )
}

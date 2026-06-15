interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

/** Plain, specific error message in the UI's voice (see 04-design.md). */
export function ErrorState({
  message = "Something didn't load. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="max-w-sm text-ui text-muted">{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

/** Inline helper to turn an unknown error into a readable string. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string') return err
  return fallback
}

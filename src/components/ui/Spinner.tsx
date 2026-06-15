interface SpinnerProps {
  size?: number
  className?: string
  label?: string
}

/** A quiet loading spinner. Never a blank flash. */
export function Spinner({ size = 18, className = '', label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`wt-spinner inline-block animate-spin rounded-full border-2 border-line border-t-accent ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/** Centered spinner for full-area loading states. */
export function LoadingArea({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center py-16">
      <Spinner size={22} label={label} />
    </div>
  )
}

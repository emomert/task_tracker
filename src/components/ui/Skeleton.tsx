/** A pulsing placeholder block. Reduced-motion users get a static block. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line/70 ${className}`} aria-hidden="true" />
}

/** A list of row placeholders — for tables, people, dashboard, etc. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-card border border-line px-4 py-3"
        >
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Three columns of card placeholders — for the board view. */
export function BoardSkeleton() {
  return (
    <div className="flex gap-4" role="status" aria-label="Loading">
      {[0, 1, 2].map((c) => (
        <div key={c} className="w-72 shrink-0 space-y-2">
          <Skeleton className="mb-1 h-4 w-24" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ))}
    </div>
  )
}

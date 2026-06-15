import type { ReactNode } from 'react'

/** Centered, calm container for the login/sign-up forms. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-card bg-accent text-lg font-semibold text-white">
            W
          </div>
          <h1 className="text-title font-semibold text-ink">{title}</h1>
          <p className="mt-1 text-ui text-muted">{subtitle}</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">{children}</div>
        <p className="mt-4 text-center text-ui text-muted">{footer}</p>
      </div>
    </div>
  )
}

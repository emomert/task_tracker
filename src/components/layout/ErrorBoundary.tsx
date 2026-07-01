import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional custom fallback. Defaults to a full-screen "reload" message. */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render/lifecycle errors in its subtree so a single thrown component
 * (e.g. the BlockNote editor choking on unexpected content) degrades to a
 * recoverable message instead of unmounting the whole app to a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // A deployed static app has no other error sink yet; at least leave a trail.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface px-6">
          <div className="max-w-sm text-center">
            <h1 className="text-title font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 text-ui text-muted">
              The app hit an unexpected error. Reloading usually fixes it — your saved
              work is safe.
            </p>
            <button
              type="button"
              className="btn-primary mt-5"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

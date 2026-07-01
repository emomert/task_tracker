import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/layout/AuthShell'
import { Spinner } from '../components/ui/Spinner'
import { errorMessage } from '../components/ui/ErrorState'
import { hasSupabaseConfig } from '../lib/supabase'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setBusy(true)
      setError(null)
      await signIn(email.trim(), password)
      const dest = (location.state as LocationState | null)?.from?.pathname ?? '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Couldn't sign you in. Check your email and password."))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your team's workspace"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {!hasSupabaseConfig && (
        <p className="mb-4 rounded-md bg-accent-soft px-3 py-2 text-meta text-ink">
          Supabase isn't configured yet. Add your keys to <code>.env</code> and restart the dev
          server.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="field-label mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-meta text-danger">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner size={14} className="border-white/40 border-t-white" />}
          Sign in
        </button>
      </form>
    </AuthShell>
  )
}

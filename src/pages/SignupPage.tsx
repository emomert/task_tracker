import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/layout/AuthShell'
import { Spinner } from '../components/ui/Spinner'
import { errorMessage } from '../components/ui/ErrorState'
import { hasSupabaseConfig } from '../lib/supabase'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.')
      return
    }
    try {
      setBusy(true)
      setError(null)
      const { needsConfirmation } = await signUp(email.trim(), password, fullName.trim())
      if (needsConfirmation) {
        setNeedsConfirmation(true)
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(errorMessage(err, "Couldn't create your account."))
    } finally {
      setBusy(false)
    }
  }

  if (needsConfirmation) {
    return (
      <AuthShell
        title="Almost there"
        subtitle="One more step"
        footer={
          <Link to="/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        }
      >
        <p className="text-ui text-muted">
          Your account was created, but email confirmation is turned on for this project. Since
          WorkTrack sends no email, ask whoever set up Supabase to turn off{' '}
          <span className="font-medium text-ink">Confirm email</span> (Authentication → Providers →
          Email), then sign in.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your team's workspace"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
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
          <label htmlFor="full-name" className="field-label mb-1.5">
            Full name
          </label>
          <input
            id="full-name"
            type="text"
            autoComplete="name"
            required
            className="input-field"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={6}
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        {error && <p className="text-meta text-priority-high">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy && <Spinner size={14} className="border-white/40 border-t-white" />}
          Create account
        </button>
      </form>
    </AuthShell>
  )
}

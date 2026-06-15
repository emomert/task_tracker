import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { qk } from '../lib/queryClient'
import { getProfile, updateProfile } from '../lib/api/profiles'
import { DEFAULT_PERSON_EMOJI } from '../lib/constants'
import { EmojiPicker } from '../components/ui/EmojiPicker'
import { Spinner, LoadingArea } from '../components/ui/Spinner'
import { ErrorState, errorMessage } from '../components/ui/ErrorState'

export function SettingsPage() {
  const { user, updatePassword } = useAuth()
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user?.id,
  })

  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('')
  const [emoji, setEmoji] = useState(DEFAULT_PERSON_EMOJI)
  const [savedNote, setSavedNote] = useState(false)

  useEffect(() => {
    const p = profileQuery.data
    if (p) {
      setFullName(p.full_name ?? '')
      setRole(p.role ?? '')
      setEmoji(p.emoji || DEFAULT_PERSON_EMOJI)
    }
  }, [profileQuery.data])

  const saveProfile = useMutation({
    mutationFn: () =>
      updateProfile(user!.id, {
        full_name: fullName.trim() || null,
        role: role.trim() || null,
        emoji,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.profiles })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      setSavedNote(true)
      window.setTimeout(() => setSavedNote(false), 2000)
    },
  })

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwError(null)
    setPwSaved(false)
    if (newPassword.length < 6) {
      setPwError('Use at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Those passwords don't match.")
      return
    }
    try {
      setPwBusy(true)
      await updatePassword(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      setPwSaved(true)
    } catch (err) {
      setPwError(errorMessage(err, "Couldn't change your password."))
    } finally {
      setPwBusy(false)
    }
  }

  if (profileQuery.isLoading) return <LoadingArea />
  if (profileQuery.isError) {
    return <ErrorState onRetry={() => profileQuery.refetch()} />
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 md:px-8">
      <h1 className="text-title font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-ui text-muted">Manage how you appear to your team.</p>

      {/* Profile */}
      <section className="mt-8">
        <h2 className="text-ui font-semibold text-ink">Your profile</h2>
        <div className="mt-4 space-y-5 rounded-card border border-line bg-surface p-6">
          <div className="flex items-start gap-4">
            <div>
              <label className="field-label mb-1.5">Avatar</label>
              <EmojiPicker value={emoji} onChange={setEmoji} size="lg" ariaLabel="Your emoji" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="name" className="field-label mb-1.5">
                  Full name
                </label>
                <input
                  id="name"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="role" className="field-label mb-1.5">
                  Role
                </label>
                <input
                  id="role"
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Designer, PM"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="field-label mb-1.5">Email</label>
            <input className="input-field bg-paper text-muted" value={user?.email ?? ''} readOnly />
            <p className="mt-1 text-meta text-muted">Set when you signed up — can't be changed.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={saveProfile.isPending}
              onClick={() => saveProfile.mutate()}
            >
              {saveProfile.isPending && (
                <Spinner size={14} className="border-white/40 border-t-white" />
              )}
              Save changes
            </button>
            {savedNote && <span className="text-meta text-status-done">Saved</span>}
            {saveProfile.isError && (
              <span className="text-meta text-priority-high">
                {errorMessage(saveProfile.error)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="mt-8">
        <h2 className="text-ui font-semibold text-ink">Password</h2>
        <form
          onSubmit={handlePasswordChange}
          className="mt-4 space-y-4 rounded-card border border-line bg-surface p-6"
        >
          <div>
            <label htmlFor="new-password" className="field-label mb-1.5">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="field-label mb-1.5">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          {pwError && <p className="text-meta text-priority-high">{pwError}</p>}
          {pwSaved && <p className="text-meta text-status-done">Password updated.</p>}
          <button type="submit" className="btn-primary" disabled={pwBusy}>
            {pwBusy && <Spinner size={14} className="border-white/40 border-t-white" />}
            Update password
          </button>
        </form>
      </section>
    </div>
  )
}

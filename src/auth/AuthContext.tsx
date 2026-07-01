import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'

interface AuthContextValue {
  session: Session | null
  user: User | null
  /** True until the initial session has been resolved. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ needsConfirmation: boolean }>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      // Wipe all cached data when the account changes so a different user on the
      // same browser can never be served the previous user's projects/people/tasks
      // from the (module-level, above-AuthProvider) query cache.
      if (event === 'SIGNED_OUT') queryClient.clear()
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          // Passed through to the handle_new_user() trigger as raw_user_meta_data.
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        // When email confirmation is enabled there is no session yet.
        return { needsConfirmation: !data.session }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        // Belt-and-suspenders: also clear here (the onAuthStateChange handler
        // above clears on SIGNED_OUT) so the cache is empty the moment we log out.
        queryClient.clear()
      },
      async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) throw error
      },
    }),
    [session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

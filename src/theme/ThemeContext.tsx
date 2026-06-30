import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocalStorageState } from '../hooks/useLocalStorageState'

type ThemePref = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'

interface ThemeContextValue {
  /** The user's stored preference. */
  pref: ThemePref
  /** What's actually applied right now ('system' resolved against the OS). */
  resolved: Resolved
  setPref: (p: ThemePref) => void
  /** Flip between light and dark (stores an explicit choice). */
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const MQ = '(prefers-color-scheme: dark)'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useLocalStorageState<ThemePref>('wt:theme', 'system')
  const [systemDark, setSystemDark] = useState<boolean>(() => window.matchMedia(MQ).matches)

  // Follow the OS preference while in 'system' mode.
  useEffect(() => {
    const mq = window.matchMedia(MQ)
    const onChange = () => setSystemDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: Resolved = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

  // Apply to <html> and keep the browser chrome color in sync.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#191919' : '#FBFBFA')
  }, [resolved])

  const value = useMemo<ThemeContextValue>(
    () => ({
      pref,
      resolved,
      setPref,
      toggle: () => setPref(resolved === 'dark' ? 'light' : 'dark'),
    }),
    [pref, resolved, setPref],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}

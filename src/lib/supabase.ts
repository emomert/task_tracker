import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when both env vars are present, so the UI can show a clear setup hint. */
export const hasSupabaseConfig = Boolean(url && anonKey)

if (!hasSupabaseConfig) {
  console.error(
    'Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL ' +
      'and VITE_SUPABASE_ANON_KEY, then restart the dev server.',
  )
}

// createClient throws on an empty/invalid URL, which would white-screen the app.
// When unconfigured we fall back to harmless placeholders so the app still loads
// and can show a clear "configure Supabase" message (auth/data calls will fail
// until real values are set, which is expected).
const FALLBACK_URL = 'http://localhost:54321'
const FALLBACK_KEY = 'public-anon-key-placeholder'

// A single, shared client for the whole app (see CLAUDE.md conventions).
// Only the public anon key is ever used in the frontend; RLS protects the data.
export const supabase = createClient<Database>(
  hasSupabaseConfig ? url : FALLBACK_URL,
  hasSupabaseConfig ? anonKey : FALLBACK_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

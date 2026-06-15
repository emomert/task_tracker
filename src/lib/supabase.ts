import { createClient } from '@supabase/supabase-js'

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

// A single, shared client for the whole app (see CLAUDE.md conventions).
// Only the public anon key is ever used in the frontend; RLS protects the data.
export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

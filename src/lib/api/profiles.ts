import { supabase } from '../supabase'
import type { Profile, ProfilePatch } from '../../types'

/** Everyone who has signed up. The pool of possible assignees. */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Profile | null) ?? null
}

/** Edit a person's display fields (name, role, emoji). Email/id are immutable. */
export async function updateProfile(id: string, patch: ProfilePatch): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) throw error
  if (!data) {
    // No profile row matched — usually the sign-up trigger never ran.
    throw new Error(
      "We couldn't find your profile. Ask whoever set up Supabase to confirm the sign-up " +
        'trigger (handle_new_user) from supabase/schema.sql is installed.',
    )
  }
  return data as Profile
}

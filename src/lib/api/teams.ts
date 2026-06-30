import { supabase } from '../supabase'
import type { Profile, Team } from '../../types'

/** All teams, alphabetical. */
export async function listTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Team[]
}

export async function createTeam(name: string): Promise<Team> {
  const { data: auth } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, created_by: auth.user?.id ?? null })
    .select('*')
    .single()
  if (error) throw error
  return data as Team
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id)
  if (error) throw error
}

export interface TeamMembership {
  team_id: string
  profile: Profile
}

/** All memberships across all teams, each with the resolved profile. */
export async function listTeamMemberships(): Promise<TeamMembership[]> {
  const { data, error } = await supabase.from('team_members').select('team_id, profile:profiles(*)')
  if (error) throw error
  return ((data ?? []) as unknown as Array<{ team_id: string; profile: Profile | null }>).filter(
    (r): r is TeamMembership => r.profile != null,
  )
}

export async function addTeamMember(teamId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .insert({ team_id: teamId, profile_id: profileId })
  if (error) throw error
}

export async function removeTeamMember(teamId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('profile_id', profileId)
  if (error) throw error
}

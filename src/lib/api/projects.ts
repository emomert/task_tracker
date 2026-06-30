import { supabase } from '../supabase'
import { sortKeyAfterMax } from '../sort'
import { DEFAULT_PROJECT_EMOJI } from '../constants'
import type { Project, ProjectPatch } from '../../types'

/** All projects, in sidebar order. */
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Project[]
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data as Project | null) ?? null
}

async function maxProjectSortOrder(): Promise<number | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? (data as { sort_order: number }).sort_order : null
}

export async function createProject(input: {
  name: string
  emoji?: string
  color?: string
  team_id?: string | null
  brief?: string | null
}): Promise<Project> {
  const sort_order = sortKeyAfterMax(await maxProjectSortOrder())
  const { data: auth } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      emoji: input.emoji ?? DEFAULT_PROJECT_EMOJI,
      color: input.color ?? 'neutral',
      team_id: input.team_id ?? null,
      brief: input.brief ?? null,
      sort_order,
      created_by: auth.user?.id ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, patch: ProjectPatch): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data as Project
}

/** Persist a project's position after a drag-reorder. */
export async function setProjectSortOrder(id: string, sortOrder: number): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ sort_order: sortOrder })
    .eq('id', id)

  if (error) throw error
}

/** Deleting a project cascades to its tasks (see schema ON DELETE CASCADE). */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

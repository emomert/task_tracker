import { supabase } from '../supabase'
import { sortKeyAfterMax } from '../sort'
import type { Subtask } from '../../types'

export async function listSubtasks(taskId: string): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Subtask[]
}

async function maxSubtaskSortOrder(taskId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('sort_order')
    .eq('task_id', taskId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? (data as { sort_order: number }).sort_order : null
}

export async function createSubtask(taskId: string, title: string): Promise<Subtask> {
  const sort_order = sortKeyAfterMax(await maxSubtaskSortOrder(taskId))
  const { data, error } = await supabase
    .from('subtasks')
    .insert({ task_id: taskId, title, sort_order })
    .select('*')
    .single()
  if (error) throw error
  return data as Subtask
}

export async function updateSubtask(
  id: string,
  patch: Partial<Pick<Subtask, 'title' | 'is_done'>>,
): Promise<void> {
  const { error } = await supabase.from('subtasks').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', id)
  if (error) throw error
}

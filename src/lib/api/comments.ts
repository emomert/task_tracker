import { supabase } from '../supabase'
import type { CommentWithAuthor } from '../../types'

export async function listComments(taskId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author:profiles(*)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as CommentWithAuthor[]
}

export async function addComment(taskId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, body, author_id: auth.user?.id ?? null })
  if (error) throw error
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) throw error
}

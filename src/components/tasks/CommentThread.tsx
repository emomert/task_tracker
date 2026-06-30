import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../../auth/AuthContext'
import { qk } from '../../lib/queryClient'
import { addComment, deleteComment, listComments } from '../../lib/api/comments'
import { Avatar, displayName } from '../ui/Avatar'
import { XIcon } from '../ui/Icon'

/** A discussion thread on a task. */
export function CommentThread({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: comments = [], isLoading } = useQuery({
    queryKey: qk.comments(taskId),
    queryFn: () => listComments(taskId),
  })
  const [body, setBody] = useState('')

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.comments(taskId) })
  const addMut = useMutation({
    mutationFn: (b: string) => addComment(taskId, b),
    onSuccess: () => {
      setBody('')
      invalidate()
    },
  })
  const delMut = useMutation({ mutationFn: (id: string) => deleteComment(id), onSuccess: invalidate })

  function submit() {
    const b = body.trim()
    if (b) addMut.mutate(b)
  }

  return (
    <div>
      <h3 className="mb-2 text-meta font-medium uppercase tracking-wide text-muted">Comments</h3>

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="group flex gap-2">
            <Avatar
              profile={c.author ?? { emoji: '🙂', full_name: null, email: null }}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-meta text-muted">
                <span className="font-medium text-ink">
                  {c.author ? displayName(c.author) : 'Someone'}
                </span>
                <span>{format(parseISO(c.created_at), 'MMM d, h:mm a')}</span>
                {c.author_id === user?.id && (
                  <button
                    type="button"
                    onClick={() => delMut.mutate(c.id)}
                    className="opacity-0 transition-opacity hover:text-priority-high group-hover:opacity-100"
                    aria-label="Delete comment"
                  >
                    <XIcon size={12} />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-ui text-ink">{c.body}</p>
            </div>
          </div>
        ))}
        {!isLoading && comments.length === 0 && (
          <p className="text-meta text-muted">No comments yet.</p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="mt-3 flex items-start gap-2"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={1}
          placeholder="Add a comment…  (⌘/Ctrl + Enter to send)"
          className="input-field min-h-[38px] flex-1 resize-y"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
        />
        <button
          type="submit"
          className="btn-primary shrink-0"
          disabled={addMut.isPending || !body.trim()}
        >
          Send
        </button>
      </form>
    </div>
  )
}

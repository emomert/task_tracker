import { MarkdownEditor } from './MarkdownEditor'
import { SaveIndicator } from './SaveIndicator'
import { useAutosave } from '../../hooks/useAutosave'

interface MarkdownDocEditorProps {
  initialMarkdown: string
  onSave: (markdown: string) => Promise<void>
  editable?: boolean
  /** Hide the built-in indicator if the parent shows its own. */
  showIndicator?: boolean
}

/**
 * A self-contained Markdown document surface with debounced autosave and a
 * gentle saving/saved indicator. Give it a stable `key` per document so it
 * remounts (and reloads content) when you switch projects/tasks.
 */
export function MarkdownDocEditor({
  initialMarkdown,
  onSave,
  editable = true,
  showIndicator = true,
}: MarkdownDocEditorProps) {
  const { status, onChange } = useAutosave(initialMarkdown, onSave)

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showIndicator && (
        <div className="flex h-5 items-center justify-end pr-1">
          <SaveIndicator status={status} />
        </div>
      )}
      <div className="min-h-0 flex-1">
        <MarkdownEditor
          initialMarkdown={initialMarkdown}
          onChange={onChange}
          editable={editable}
        />
      </div>
    </div>
  )
}

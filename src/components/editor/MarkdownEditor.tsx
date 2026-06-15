import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { useEffect, useRef } from 'react'

interface MarkdownEditorProps {
  /** Markdown loaded into the editor on mount. Remount (via key) to change docs. */
  initialMarkdown: string
  /** Fires with the serialized Markdown whenever the user edits. */
  onChange: (markdown: string) => void
  editable?: boolean
}

/**
 * Thin BlockNote wrapper. Markdown is the source of truth: it loads Markdown in
 * and serializes Markdown out (CLAUDE.md hard rule #1). In BlockNote 0.51 the
 * Markdown conversions are synchronous.
 */
export function MarkdownEditor({
  initialMarkdown,
  onChange,
  editable = true,
}: MarkdownEditorProps) {
  const editor = useCreateBlockNote()
  const ready = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    ready.current = false
    const md = initialMarkdown.trim()
    if (md) {
      const blocks = editor.tryParseMarkdownToBlocks(md)
      if (blocks.length > 0) {
        editor.replaceBlocks(editor.document, blocks)
      }
    }
    // Only emit change events after the initial content has been placed, so the
    // load itself never triggers a spurious save.
    const raf = requestAnimationFrame(() => {
      ready.current = true
    })
    return () => cancelAnimationFrame(raf)
    // Runs once per editor instance; the parent remounts (key) to switch docs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      className="wt-editor"
      onChange={() => {
        if (!ready.current) return
        onChangeRef.current(editor.blocksToMarkdownLossy(editor.document))
      }}
    />
  )
}

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * RichTextEditor - WYSIWYG editor with Markdown serialization
 * 
 * @param {Object} props
 * @param {string} props.value - Markdown string value
 * @param {Function} props.onChange - Called with markdown string on change
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Additional class names
 */
export function RichTextEditor({ value, onChange, placeholder, className }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Markdown.configure({
                html: false,
                transformCopiedText: true,
                transformPastedText: true,
            }),
        ],
        content: value || '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm dark:prose-invert max-w-none min-h-[120px] px-3 py-2 focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            // Get markdown from editor
            const markdown = editor.storage.markdown.getMarkdown()
            onChange?.(markdown)
        },
    })

    // Update editor content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.storage.markdown.getMarkdown()) {
            editor.commands.setContent(value || '')
        }
    }, [value, editor])

    if (!editor) {
        return null
    }

    return (
        <div className={cn("border rounded-md bg-background", className)}>
            {/* Toolbar */}
            <div className="flex gap-1 p-1 border-b bg-muted/50">
                <Button
                    type="button"
                    variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />
        </div>
    )
}

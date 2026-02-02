import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './RichTextEditor.css';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    readOnly?: boolean;
}

export default function RichTextEditor({
    content,
    onChange,
    placeholder = '开始输入...',
    readOnly = false
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder })
        ],
        content,
        editable: !readOnly,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        }
    });

    if (!editor) return null;

    return (
        <div className="rich-text-editor">
            {!readOnly && (
                <div className="editor-toolbar">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'active' : ''}
                        title="粗体"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'active' : ''}
                        title="斜体"
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
                        title="标题"
                    >
                        H
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'active' : ''}
                        title="列表"
                    >
                        •
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={editor.isActive('blockquote') ? 'active' : ''}
                        title="引用"
                    >
                        "
                    </button>
                </div>
            )}
            <EditorContent editor={editor} className="editor-content" />
        </div>
    );
}

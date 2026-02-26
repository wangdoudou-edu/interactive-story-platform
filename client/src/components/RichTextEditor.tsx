import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
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
    placeholder,
    readOnly = false
}: RichTextEditorProps) {
    const { t } = useTranslation();
    const finalPlaceholder = placeholder || t('richTextEditor.placeholder');
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: finalPlaceholder })
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
                        title={t('richTextEditor.bold')}
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'active' : ''}
                        title={t('richTextEditor.italic')}
                    >
                        <em>I</em>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
                        title={t('richTextEditor.heading')}
                    >
                        H
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={editor.isActive('bulletList') ? 'active' : ''}
                        title={t('richTextEditor.list')}
                    >
                        •
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={editor.isActive('blockquote') ? 'active' : ''}
                        title={t('richTextEditor.quote')}
                    >
                        "
                    </button>
                </div>
            )}
            <EditorContent editor={editor} className="editor-content" />
        </div>
    );
}

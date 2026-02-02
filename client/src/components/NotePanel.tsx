import { useEffect, useState, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import { noteApi } from '../services/api';
import './EditorPanel.css';

interface NotePanelProps {
    conversationId: string | null;
}

export default function NotePanel({ conversationId }: NotePanelProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (conversationId) {
            loadNote();
        }
    }, [conversationId]);

    const loadNote = async () => {
        if (!conversationId) return;

        setLoading(true);
        try {
            const note = await noteApi.get(conversationId);
            setContent(note.content || '');
        } catch (error) {
            console.error('Load note error:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveNote = useCallback(async (newContent: string) => {
        if (!conversationId) return;

        setSaving(true);
        try {
            await noteApi.update(conversationId, newContent);
        } catch (error) {
            console.error('Save note error:', error);
        } finally {
            setSaving(false);
        }
    }, [conversationId]);

    // 防抖保存
    useEffect(() => {
        if (!conversationId || !content) return;

        const timer = setTimeout(() => {
            saveNote(content);
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, conversationId, saveNote]);

    const handleChange = (newContent: string) => {
        setContent(newContent);
    };

    if (!conversationId) {
        return (
            <div className="editor-panel">
                <div className="panel-header">
                    <h3>📚 笔记区</h3>
                </div>
                <div className="panel-empty">
                    <p>选择对话后开始记录知识点</p>
                </div>
            </div>
        );
    }

    return (
        <div className="editor-panel">
            <div className="panel-header">
                <h3>📚 笔记区</h3>
                {saving && <span className="saving-indicator">保存中...</span>}
            </div>
            {loading ? (
                <div className="panel-loading">加载中...</div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                    placeholder="记录学习到的知识点..."
                />
            )}
        </div>
    );
}

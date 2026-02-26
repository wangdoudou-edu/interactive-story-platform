import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RichTextEditor from './RichTextEditor';
import NoteCard from './NoteCard';
import { noteApi } from '../services/api';
import { useAnnotationStore } from '../stores/annotationStore';
import './EditorPanel.css';

interface NotePanelProps {
    conversationId: string | null;
}

export default function NotePanel({ conversationId }: NotePanelProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [cardsExpanded, setCardsExpanded] = useState(true);
    const { annotations } = useAnnotationStore();

    // Extract all KNOWLEDGE annotations across loaded messages
    const knowledgePoints = useMemo(() => {
        const points: Array<{ id: string; text: string; messageId: string; createdAt: string }> = [];
        for (const [messageId, anns] of annotations) {
            for (const a of anns) {
                if (a.type === 'KNOWLEDGE' && !a.isDeleted) {
                    points.push({
                        id: a.id,
                        text: a.selectedText,
                        messageId,
                        createdAt: a.createdAt,
                    });
                }
            }
        }
        return points.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [annotations]);

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
                    <h3>{t('notePanel.title')}</h3>
                </div>
                <div className="panel-empty">
                    <p>{t('notePanel.emptyText')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="editor-panel">
            <div className="panel-header">
                <div className="header-left">
                    <h3>{t('notePanel.title')}</h3>
                    {saving && <span className="saving-indicator">{t('common.loading')}</span>}
                </div>
                {knowledgePoints.length > 0 && (
                    <button
                        className="history-btn"
                        onClick={() => setCardsExpanded(!cardsExpanded)}
                    >
                        {t('notePanel.knowledgePoints')} ({knowledgePoints.length}) {cardsExpanded ? '▾' : '▸'}
                    </button>
                )}
            </div>

            {/* Knowledge Point Cards */}
            {cardsExpanded && knowledgePoints.length > 0 && (
                <div className="knowledge-cards-section">
                    {knowledgePoints.map(kp => (
                        <NoteCard
                            key={kp.id}
                            text={kp.text}
                            createdAt={kp.createdAt}
                        />
                    ))}
                </div>
            )}

            {loading ? (
                <div className="panel-loading">{t('common.loading')}</div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                    placeholder={t('notePanel.placeholder')}
                />
            )}
        </div>
    );
}

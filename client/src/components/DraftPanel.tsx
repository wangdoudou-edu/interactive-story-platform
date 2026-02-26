import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import RichTextEditor from './RichTextEditor';
import { draftApi } from '../services/api';
import './EditorPanel.css';

interface DraftPanelProps {
    conversationId: string | null;
}

interface DraftHistoryItem {
    id: string;
    roundNumber: number;
    content: string;
    createdAt: string;
}

export default function DraftPanel({ conversationId }: DraftPanelProps) {
    const { t } = useTranslation();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<DraftHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (conversationId) {
            loadDraft();
            loadHistory();
        }
    }, [conversationId]);

    const loadDraft = async () => {
        if (!conversationId) return;

        setLoading(true);
        try {
            const draft = await draftApi.get(conversationId);
            setContent(draft.content || '');
        } catch (error) {
            console.error('Load draft error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        if (!conversationId) return;

        try {
            const data = await draftApi.getHistory(conversationId);
            setHistory(data);
        } catch (error) {
            console.error('Load history error:', error);
        }
    };

    const saveDraft = useCallback(async (newContent: string) => {
        if (!conversationId) return;

        setSaving(true);
        try {
            await draftApi.update(conversationId, newContent);
        } catch (error) {
            console.error('Save draft error:', error);
        } finally {
            setSaving(false);
        }
    }, [conversationId]);

    // 防抖保存
    useEffect(() => {
        if (!conversationId || !content) return;

        const timer = setTimeout(() => {
            saveDraft(content);
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, conversationId, saveDraft]);

    const handleChange = (newContent: string) => {
        setContent(newContent);
    };

    const handleSnapshot = async () => {
        if (!conversationId || !content) return;

        try {
            await draftApi.snapshot(conversationId);
            await loadHistory();
            alert(t('draftPanel.savedSnapshot', { round: history.length + 1 }));
        } catch (error) {
            console.error('Snapshot error:', error);
        }
    };

    const handleLoadHistory = (item: DraftHistoryItem) => {
        if (confirm(t('draftPanel.loadHistoryConfirm', { round: item.roundNumber }))) {
            setContent(item.content);
            setShowHistory(false);
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedText = e.dataTransfer.getData('text/plain');
        if (droppedText) {
            // Append the dropped knowledge point as a new paragraph
            const newBlock = `<p><strong>${t('draftPanel.knowledgePointPrefix')}</strong>${droppedText}</p>`;
            setContent(prev => prev ? `${prev}${newBlock}` : newBlock);
        }
    };

    if (!conversationId) {
        return (
            <div className="editor-panel draft-panel">
                <div className="panel-header">
                    <h3>{t('draftPanel.title')}</h3>
                </div>
                <div className="panel-empty">
                    <p>{t('draftPanel.emptyText')}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`editor-panel draft-panel ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={editorRef}
        >
            <div className="panel-header">
                <div className="header-left">
                    <h3>{t('draftPanel.title')}</h3>
                    {saving && <span className="saving-indicator">{t('draftPanel.saving')}</span>}
                </div>
                <div className="header-actions">
                    {history.length > 0 && (
                        <button
                            className="history-btn"
                            onClick={() => setShowHistory(!showHistory)}
                            title={t('draftPanel.viewHistory')}
                        >
                            {t('draftPanel.historyCount', { count: history.length })}
                        </button>
                    )}
                    <button
                        className="snapshot-btn"
                        onClick={handleSnapshot}
                        title={t('draftPanel.saveSnapshotBtnTitle')}
                    >
                        {t('draftPanel.completeRoundBtn')}
                    </button>
                </div>
            </div>

            {showHistory && (
                <div className="history-list">
                    {history.map(item => (
                        <div
                            key={item.id}
                            className="history-item"
                            onClick={() => handleLoadHistory(item)}
                        >
                            <span className="round">{t('draftPanel.roundText', { round: item.roundNumber })}</span>
                            <span className="date">
                                {new Date(item.createdAt).toLocaleString('zh-CN')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone visual hint */}
            {dragOver && (
                <div className="drop-zone-hint">
                    {t('draftPanel.dropHint')}
                </div>
            )}

            {loading ? (
                <div className="panel-loading">{t('common.loading')}</div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                    placeholder={t('draftPanel.placeholder')}
                />
            )}
        </div>
    );
}

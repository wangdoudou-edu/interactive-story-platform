import { useEffect, useState, useCallback } from 'react';
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
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<DraftHistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);

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
            alert('已保存为第 ' + (history.length + 1) + ' 轮快照');
        } catch (error) {
            console.error('Snapshot error:', error);
        }
    };

    const handleLoadHistory = (item: DraftHistoryItem) => {
        if (confirm(`加载第 ${item.roundNumber} 轮的内容？当前内容会被替换。`)) {
            setContent(item.content);
            setShowHistory(false);
        }
    };

    if (!conversationId) {
        return (
            <div className="editor-panel draft-panel">
                <div className="panel-header">
                    <h3>📝 草稿区</h3>
                </div>
                <div className="panel-empty">
                    <p>选择对话后开始整理内容</p>
                </div>
            </div>
        );
    }

    return (
        <div className="editor-panel draft-panel">
            <div className="panel-header">
                <div className="header-left">
                    <h3>📝 草稿区</h3>
                    {saving && <span className="saving-indicator">保存中...</span>}
                </div>
                <div className="header-actions">
                    {history.length > 0 && (
                        <button
                            className="history-btn"
                            onClick={() => setShowHistory(!showHistory)}
                            title="查看历史"
                        >
                            📋 历史 ({history.length})
                        </button>
                    )}
                    <button
                        className="snapshot-btn"
                        onClick={handleSnapshot}
                        title="保存快照并开始下一轮"
                    >
                        ✓ 完成本轮
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
                            <span className="round">第 {item.roundNumber} 轮</span>
                            <span className="date">
                                {new Date(item.createdAt).toLocaleString('zh-CN')}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="panel-loading">加载中...</div>
            ) : (
                <RichTextEditor
                    content={content}
                    onChange={handleChange}
                    placeholder="整理 AI 回答中的有价值内容..."
                />
            )}
        </div>
    );
}

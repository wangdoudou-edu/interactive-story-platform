import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAnnotationStore } from '../stores/annotationStore';
import './MessageList.css';

interface SelectionInfo {
    messageId: string;
    text: string;
    aiConfigId?: string;
    startOffset: number;
    endOffset: number;
}

export default function MessageList() {
    const { messages, aiConfigs, isSending, currentConversation } = useChatStore();
    const { annotations, addAnnotation, loadAnnotations, addToNote, organizeToDraft } = useAnnotationStore();
    const listRef = useRef<HTMLDivElement>(null);
    const [selection, setSelection] = useState<SelectionInfo | null>(null);
    const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
    const [showAnnotationMenu, setShowAnnotationMenu] = useState(false);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages]);

    // 加载消息的批注
    useEffect(() => {
        messages.forEach(msg => {
            if (msg.role === 'assistant' && !annotations.has(msg.id)) {
                loadAnnotations(msg.id);
            }
        });
    }, [messages]);

    const getAIInfo = (aiConfigId?: string) => {
        if (!aiConfigId) return null;
        return aiConfigs.find(c => c.id === aiConfigId);
    };

    const getProviderColor = (provider?: string) => {
        switch (provider) {
            case 'gemini': return '#4285f4';
            case 'openai': return '#10a37f';
            case 'deepseek': return '#7c3aed';
            case 'qwen': return '#ff6a00';
            default: return '#6366f1';
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    };

    // 处理文本选择
    const handleMouseUp = (messageId: string, aiConfigId?: string) => {
        const sel = window.getSelection();
        const selectedText = sel?.toString().trim();

        if (selectedText && selectedText.length > 0) {
            const range = sel?.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                setPopupPos({
                    x: rect.left + rect.width / 2,
                    y: rect.top - 10
                });
                setSelection({
                    messageId,
                    text: selectedText,
                    aiConfigId,
                    startOffset: range.startOffset,
                    endOffset: range.endOffset
                });
                setShowAnnotationMenu(true);
            }
        }
    };

    // 添加知识点
    const handleKnowledge = async () => {
        if (!selection || !currentConversation) return;

        const aiInfo = getAIInfo(selection.aiConfigId);
        await addAnnotation({
            messageId: selection.messageId,
            selectedText: selection.text,
            type: 'KNOWLEDGE',
            startOffset: selection.startOffset,
            endOffset: selection.endOffset
        });
        await addToNote(currentConversation.id, selection.text, aiInfo?.name || 'AI');
        closeMenu();
    };

    // 标记删除
    const handleDelete = async () => {
        if (!selection) return;

        await addAnnotation({
            messageId: selection.messageId,
            selectedText: selection.text,
            type: 'DELETE',
            startOffset: selection.startOffset,
            endOffset: selection.endOffset
        });
        closeMenu();
    };

    // 添加批注
    const handleComment = async (label: string) => {
        if (!selection) return;

        const note = prompt('添加批注内容（可选）：');
        await addAnnotation({
            messageId: selection.messageId,
            selectedText: selection.text,
            type: 'COMMENT',
            label,
            note: note || undefined,
            startOffset: selection.startOffset,
            endOffset: selection.endOffset
        });
        closeMenu();
    };

    // 整理到草稿
    const handleOrganize = async (messageId: string, aiConfigId?: string) => {
        if (!currentConversation) return;

        const aiInfo = getAIInfo(aiConfigId);
        const msgAnnotations = annotations.get(messageId) || [];

        await organizeToDraft(
            currentConversation.id,
            messageId,
            aiInfo?.name || 'AI',
            msgAnnotations.map(a => ({
                selectedText: a.selectedText,
                label: a.label,
                note: a.note
            }))
        );
        alert('已整理到草稿区');
    };

    const closeMenu = () => {
        setShowAnnotationMenu(false);
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };

    // 点击其他地方时关闭菜单
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.annotation-menu')) {
                setTimeout(() => {
                    const selectedText = window.getSelection()?.toString().trim();
                    if (!selectedText) {
                        closeMenu();
                    }
                }, 100);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 渲染带批注的内容
    const renderAnnotatedContent = (content: string, messageId: string) => {
        const msgAnnotations = annotations.get(messageId) || [];

        if (msgAnnotations.length === 0) {
            return content;
        }

        // 简单渲染：显示批注标记
        return (
            <div className="annotated-content">
                {content}
                {msgAnnotations.length > 0 && (
                    <div className="annotation-indicators">
                        {msgAnnotations.map(a => (
                            <span
                                key={a.id}
                                className={`annotation-badge ${a.type.toLowerCase()}`}
                                title={`${a.selectedText}${a.note ? `: ${a.note}` : ''}`}
                            >
                                {a.type === 'KNOWLEDGE' && '📌'}
                                {a.type === 'DELETE' && '🗑️'}
                                {a.type === 'COMMENT' && (
                                    a.label === 'DOUBT' ? '❓' :
                                        a.label === 'INSPIRATION' ? '💡' :
                                            a.label === 'QUESTION' ? '🤔' : '📝'
                                )}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="message-list" ref={listRef}>
            {/* 批注菜单 */}
            {showAnnotationMenu && selection && (
                <div
                    className="annotation-menu"
                    style={{ left: popupPos.x, top: popupPos.y }}
                >
                    <button onClick={handleKnowledge} title="标记为知识点">📌 知识点</button>
                    <button onClick={handleDelete} title="标记删除">🗑️ 删除</button>
                    <div className="menu-divider"></div>
                    <button onClick={() => handleComment('DOUBT')} title="疑问">❓</button>
                    <button onClick={() => handleComment('INSPIRATION')} title="灵感">💡</button>
                    <button onClick={() => handleComment('QUESTION')} title="提问">🤔</button>
                    <button onClick={() => handleComment('NOTE')} title="备注">📝</button>
                </div>
            )}

            <div className="message-list-inner">
                {messages.map((message) => {
                    const aiInfo = getAIInfo(message.aiConfigId);
                    const isUser = message.role === 'user';
                    const msgAnnotations = annotations.get(message.id) || [];

                    return (
                        <div key={message.id} className={`message ${isUser ? 'user' : 'assistant'}`}>
                            <div className="message-avatar">
                                {isUser ? (
                                    <span className="avatar-icon">👤</span>
                                ) : (
                                    <span
                                        className="avatar-icon ai-avatar"
                                        style={{ background: getProviderColor(aiInfo?.provider) }}
                                    >
                                        {aiInfo?.avatar || '🤖'}
                                    </span>
                                )}
                            </div>

                            <div className="message-body">
                                <div className="message-header">
                                    <span className="message-sender">
                                        {isUser ? '你' : (aiInfo?.name || 'AI')}
                                    </span>
                                    {!isUser && aiInfo && (
                                        <span className="message-provider" style={{ color: getProviderColor(aiInfo.provider) }}>
                                            {aiInfo.provider}
                                        </span>
                                    )}
                                    <span className="message-time">{formatTime(message.createdAt)}</span>

                                    {/* AI 消息显示整理按钮 */}
                                    {!isUser && msgAnnotations.length > 0 && (
                                        <button
                                            className="organize-btn"
                                            onClick={() => handleOrganize(message.id, message.aiConfigId)}
                                            title="整理到草稿区"
                                        >
                                            📋 整理
                                        </button>
                                    )}
                                </div>

                                <div
                                    className="message-content"
                                    onMouseUp={() => !isUser && handleMouseUp(message.id, message.aiConfigId)}
                                >
                                    {renderAnnotatedContent(message.content, message.id)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {isSending && (
                    <div className="message assistant">
                        <div className="message-avatar">
                            <span className="avatar-icon ai-avatar">🤖</span>
                        </div>
                        <div className="message-body">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

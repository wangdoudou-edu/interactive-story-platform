import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../stores/chatStore';
import MessageList from './MessageList';
import AISelector from './AISelector';
import FileUpload from './FileUpload';
import './ChatArea.css';

interface UploadedFile {
    id: string;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
}

export default function ChatArea() {
    const { t } = useTranslation();
    const {
        currentConversation,
        messages,
        isSending,
        sendMessage,
        createConversation
    } = useChatStore();

    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleFileUpload = (files: UploadedFile[]) => {
        setAttachments(prev => [...prev, ...files]);
    };

    const removeAttachment = (filename: string) => {
        setAttachments(prev => prev.filter(f => f.filename !== filename));
    };

    const handleSubmit = async () => {
        if ((!input.trim() && attachments.length === 0) || isSending) return;

        let content = input.trim();

        // 如果有附件，添加到消息中
        if (attachments.length > 0) {
            const attachmentInfo = attachments.map(f =>
                f.mimetype.startsWith('image/')
                    ? `![${f.originalName}](http://localhost:3001${f.url})`
                    : `[📎 ${f.originalName}](http://localhost:3001${f.url})`
            ).join('\n');
            content = content ? `${content}\n\n${attachmentInfo}` : attachmentInfo;
        }

        setInput('');
        setAttachments([]);

        try {
            if (!currentConversation) {
                await createConversation(content.slice(0, 50));
            }
            await sendMessage(content);
        } catch (e: any) {
            console.error('Failed to send message:', e);
            setInput(content);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.startsWith('image/')) return '🖼️';
        if (mimetype.includes('pdf')) return '📄';
        if (mimetype.includes('word') || mimetype.includes('document')) return '📝';
        return '📎';
    };

    return (
        <main className="chat-area">
            {!currentConversation && messages.length === 0 ? (
                <div className="welcome-screen">
                    <div className="welcome-content">
                        <div className="welcome-icon">🤖</div>
                        <h1>{t('chatArea.welcomeTitle')}</h1>
                        <p>{t('chatArea.welcomeSubtitle')}</p>

                        <div className="features">
                            <div className="feature">
                                <span className="feature-icon">💬</span>
                                <div className="feature-text">
                                    <h3>{t('chatArea.feature1Title')}</h3>
                                    <p>{t('chatArea.feature1Desc')}</p>
                                </div>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">📝</span>
                                <div className="feature-text">
                                    <h3>{t('chatArea.feature2Title')}</h3>
                                    <p>{t('chatArea.feature2Desc')}</p>
                                </div>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✨</span>
                                <div className="feature-text">
                                    <h3>{t('chatArea.feature3Title')}</h3>
                                    <p>{t('chatArea.feature3Desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <MessageList />
            )}

            <div className="chat-input-area">
                <AISelector />

                {/* 附件预览 */}
                {attachments.length > 0 && (
                    <div className="attachments-preview">
                        {attachments.map(file => (
                            <div key={file.filename} className="attachment-item">
                                <span className="attachment-icon">{getFileIcon(file.mimetype)}</span>
                                <div className="attachment-info">
                                    <span className="attachment-name">{file.originalName}</span>
                                    <span className="attachment-size">{formatFileSize(file.size)}</span>
                                </div>
                                <button
                                    className="attachment-remove"
                                    onClick={() => removeAttachment(file.filename)}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="input-container">
                    <FileUpload onUpload={handleFileUpload} multiple />

                    <textarea
                        ref={textareaRef}
                        className="chat-input"
                        placeholder={t('chatArea.placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isSending}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSubmit}
                        disabled={(!input.trim() && attachments.length === 0) || isSending}
                    >
                        {isSending ? (
                            <span className="loading-spinner small"></span>
                        ) : (
                            <span className="send-icon">➤</span>
                        )}
                    </button>
                </div>
            </div>
        </main>
    );
}

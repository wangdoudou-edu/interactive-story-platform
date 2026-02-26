import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../stores/chatStore';
import './ChatSidebar.css';

interface ChatSidebarProps {
    collapsed: boolean;
}

export default function ChatSidebar({ collapsed }: ChatSidebarProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const {
        conversations,
        currentConversation,
        selectConversation,
        createConversation,
        deleteConversation,
        isLoading
    } = useChatStore();

    const handleNewChat = async () => {
        await createConversation();
    };

    const handleSelectConversation = async (id: string) => {
        await selectConversation(id);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm(t('chatSidebar.confirmDelete'))) {
            await deleteConversation(id);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return t('chatSidebar.timeAgo.today');
        if (days === 1) return t('chatSidebar.timeAgo.yesterday');
        if (days < 7) return t('chatSidebar.timeAgo.daysAgo', { count: days });
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-CN');
    };

    return (
        <aside className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <button className="new-chat-btn" onClick={handleNewChat}>
                <span className="new-chat-icon">+</span>
                <span className="new-chat-text">{t('chatSidebar.newChat')}</span>
            </button>

            <div className="conversations-list">
                {isLoading && conversations.length === 0 ? (
                    <div className="sidebar-loading">
                        <span className="loading-spinner"></span>
                        <span>{t('chatSidebar.loading')}</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="no-conversations">
                        <span className="empty-icon">💬</span>
                        <span>{t('chatSidebar.noConversations')}</span>
                        <span className="empty-hint">{t('chatSidebar.emptyHint')}</span>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <div
                            key={conv.id}
                            className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                            onClick={() => handleSelectConversation(conv.id)}
                        >
                            <div className="conversation-content">
                                <span className="conversation-icon">💭</span>
                                <div className="conversation-info">
                                    <span className="conversation-title">
                                        {conv.title || t('chatSidebar.defaultTitle')}
                                    </span>
                                    <span className="conversation-date">
                                        {formatDate(conv.updatedAt)}
                                    </span>
                                </div>
                                {conv.messages && conv.messages.length > 0 && (
                                    <span className="msg-count-badge">
                                        {conv.messages.length}
                                    </span>
                                )}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(e, conv.id)}
                                title={t('chatSidebar.deleteTitle')}
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>

            <button
                className="back-to-projects"
                onClick={() => navigate('/projects')}
                title={t('chatSidebar.backTitle')}
            >
                <span className="back-icon">📂</span>
                <span className="back-text">{t('chatSidebar.backToProjects')}</span>
            </button>
        </aside>
    );
}

import { useChatStore } from '../stores/chatStore';
import './ChatSidebar.css';

interface ChatSidebarProps {
    collapsed: boolean;
}

export default function ChatSidebar({ collapsed }: ChatSidebarProps) {
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
        if (confirm('确定要删除这个对话吗？')) {
            await deleteConversation(id);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN');
    };

    return (
        <aside className={`chat-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <button className="new-chat-btn" onClick={handleNewChat}>
                <span className="new-chat-icon">+</span>
                <span className="new-chat-text">新对话</span>
            </button>

            <div className="conversations-list">
                {isLoading && conversations.length === 0 ? (
                    <div className="sidebar-loading">
                        <span className="loading-spinner"></span>
                        <span>加载中...</span>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="no-conversations">
                        <span className="empty-icon">💬</span>
                        <span>暂无对话</span>
                        <span className="empty-hint">点击上方按钮开始新对话</span>
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
                                        {conv.title || '新对话'}
                                    </span>
                                    <span className="conversation-date">
                                        {formatDate(conv.updatedAt)}
                                    </span>
                                </div>
                            </div>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDelete(e, conv.id)}
                                title="删除对话"
                            >
                                🗑️
                            </button>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}

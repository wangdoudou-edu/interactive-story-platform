import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import ChatArea from '../components/ChatArea';
import NotePanel from '../components/NotePanel';
import DraftPanel from '../components/DraftPanel';
import TaskFlowPanel from '../components/TaskFlowPanel';
import './ChatPage.css';

export default function ChatPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { loadConversations, loadAIConfigs, currentConversation } = useChatStore();
    const [panelsCollapsed, setPanelsCollapsed] = useState(false);

    useEffect(() => {
        loadConversations();
        loadAIConfigs();
    }, [loadConversations, loadAIConfigs]);

    const handleLogout = async () => {
        await logout();
    };

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <div className="header-left">
                    <div className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text">AIMind Studio</span>
                    </div>
                </div>

                <div className="header-right">
                    <button className="pl-btn-lang" onClick={toggleLanguage} style={{ marginRight: '12px', padding: '4px 12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {i18n.language === 'en' ? '中' : 'EN'}
                    </button>
                    {user?.role === 'TEACHER' && (
                        <button
                            className="btn-dashboard"
                            onClick={() => navigate('/teacher')}
                            title={t('common.dashboard')}
                        >
                            📊 {t('common.dashboard')}
                        </button>
                    )}
                    <button
                        className="panel-toggle"
                        onClick={() => setPanelsCollapsed(!panelsCollapsed)}
                        title={t('chatPage.togglePanels')}
                    >
                        {panelsCollapsed ? '📝' : '✕'}
                    </button>
                    <div className="user-info">
                        <span className="user-role">{user?.role === 'TEACHER' ? '👨‍🏫' : '📚'}</span>
                        <span className="user-name">{user?.name}</span>
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>
                        {t('common.logout')}
                    </button>
                </div>
            </header>

            <div className="chat-main">
                {/* 任务流程面板 (左侧边栏) */}
                <div className="task-flow-container">
                    <TaskFlowPanel conversationId={currentConversation?.id || null} />
                </div>

                <ChatArea />

                {!panelsCollapsed && (
                    <div className="side-panels">
                        <NotePanel conversationId={currentConversation?.id || null} />
                        <DraftPanel conversationId={currentConversation?.id || null} />
                    </div>
                )}
            </div>
        </div>
    );
}

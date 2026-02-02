import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import ChatSidebar from '../components/ChatSidebar';
import ChatArea from '../components/ChatArea';
import NotePanel from '../components/NotePanel';
import DraftPanel from '../components/DraftPanel';
import TaskFlowPanel from '../components/TaskFlowPanel';
import './ChatPage.css';

export default function ChatPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { loadConversations, loadAIConfigs, currentConversation } = useChatStore();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [panelsCollapsed, setPanelsCollapsed] = useState(false);
    const [showTaskFlow, setShowTaskFlow] = useState(true);

    useEffect(() => {
        loadConversations();
        loadAIConfigs();
    }, [loadConversations, loadAIConfigs]);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <div className="header-left">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    >
                        <span className="toggle-icon">{sidebarCollapsed ? '☰' : '✕'}</span>
                    </button>
                    <div className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text">AI-LOP</span>
                    </div>
                </div>

                <div className="header-right">
                    {user?.role === 'TEACHER' && (
                        <button
                            className="btn-dashboard"
                            onClick={() => navigate('/teacher')}
                            title="教师仪表盘"
                        >
                            📊 仪表盘
                        </button>
                    )}
                    <button
                        className={`task-flow-toggle ${showTaskFlow ? 'active' : ''}`}
                        onClick={() => setShowTaskFlow(!showTaskFlow)}
                        title={showTaskFlow ? '隐藏任务流程' : '显示任务流程'}
                    >
                        📋
                    </button>
                    <button
                        className="panel-toggle"
                        onClick={() => setPanelsCollapsed(!panelsCollapsed)}
                        title={panelsCollapsed ? '显示笔记/草稿区' : '隐藏笔记/草稿区'}
                    >
                        {panelsCollapsed ? '📝' : '✕'}
                    </button>
                    <div className="user-info">
                        <span className="user-role">{user?.role === 'TEACHER' ? '👨‍🏫' : '📚'}</span>
                        <span className="user-name">{user?.name}</span>
                    </div>
                    <button className="btn-logout" onClick={handleLogout}>
                        退出
                    </button>
                </div>
            </header>

            <div className="chat-main">
                <ChatSidebar collapsed={sidebarCollapsed} />

                {/* 任务流程面板 */}
                {showTaskFlow && (
                    <div className="task-flow-container">
                        <TaskFlowPanel conversationId={currentConversation?.id || null} />
                    </div>
                )}

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

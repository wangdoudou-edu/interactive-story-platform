import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useChatStore } from '../stores/chatStore';
import './TaskFlowPanel.css';

interface TaskFlowPanelProps {
    conversationId: string | null;
}

// Fallback tasks for "游戏叙事设计" as requested by user
const DEFAULT_TASKS = [
    { name: '概念构思', description: '确定游戏核心玩法与主题' },
    { name: '世界观设定', description: '构建游戏背后的虚拟世界' },
    { name: '角色设计', description: '设计主角和关键NPC' },
    { name: '情节架构', description: '规划游戏的主要剧情线' },
    { name: '交互机制', description: '设计玩家的互动方式' },
    { name: '对话编写', description: '撰写游戏内对话和文本' },
    { name: '整合优化', description: '最终内容的整合与打磨' }
];

export default function TaskFlowPanel({ }: TaskFlowPanelProps) {
    const navigate = useNavigate();
    const {
        currentProject,
        loadProjects,
        loadTemplates
    } = useProjectStore();
    const {
        conversations,
        currentConversation,
        selectConversation,
        createConversation
    } = useChatStore();

    const [expandedTaskIndex, setExpandedTaskIndex] = useState<number>(0);

    useEffect(() => {
        loadProjects();
        loadTemplates();
    }, [loadProjects, loadTemplates]);

    // 获取任务列表
    const projectTasks = currentProject?.template?.tasks || [];
    const tasks = projectTasks.length > 0 ? projectTasks : DEFAULT_TASKS;
    const progress = currentProject?.progress || [];

    // Auto-expand current task if project has one
    useEffect(() => {
        if (currentProject?.currentTask !== undefined) {
            setExpandedTaskIndex(currentProject.currentTask);
        }
    }, [currentProject?.currentTask]);

    const completedCount = progress.filter(p => p.status === 'COMPLETED').length;
    const totalCount = tasks.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const handleNewChat = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await createConversation();
    };

    const handleSelectConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await selectConversation(id);
    };

    // const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    //     e.stopPropagation();
    //     if (confirm(t('chatSidebar.confirmDelete') || '确定要删除这个对话吗？')) {
    //         await deleteConversation(id);
    //     }
    // };

    return (
        <div className="task-flow-panel">
            <div className="tf-header">
                <button
                    className="btn-tf-back"
                    onClick={() => navigate('/projects')}
                >
                    <span className="back-icon">←</span> 返回项目列表
                </button>
                <div className="tf-project-info">
                    <h2 className="tf-project-title">
                        {currentProject?.title || currentProject?.template?.name || "游戏叙事设计"}
                    </h2>
                    <p className="tf-project-desc">
                        {currentProject?.template?.description || "探索游戏中的故事讲述技巧与互动叙事"}
                    </p>
                </div>
            </div>

            <div className="tf-progress-section">
                <div className="tf-progress-header">
                    <span>任务流程</span>
                    <span>{completedCount}/{totalCount}</span>
                </div>
                <div className="tf-progress-bar">
                    <div className="tf-progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>

            <div className="tf-tasks-list">
                {tasks.map((task, index) => {
                    const isExpanded = expandedTaskIndex === index;
                    const taskStatus = progress.find(p => p.taskIndex === index)?.status || 'PENDING';
                    const isCompleted = taskStatus === 'COMPLETED';

                    return (
                        <div
                            key={index}
                            className={`tf-task-item ${isExpanded ? 'expanded' : ''} ${isCompleted ? 'completed' : ''}`}
                        >
                            <div
                                className="tf-task-header"
                                onClick={() => setExpandedTaskIndex(isExpanded ? -1 : index)}
                            >
                                <div className={`tf-task-circle ${isExpanded ? 'active' : ''}`}>
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                <span className="tf-task-name">{task.name || (task as any).title}</span>
                                <span className={`tf-task-arrow ${isExpanded ? 'down' : ''}`}>›</span>
                            </div>

                            {isExpanded && (
                                <div className="tf-task-content">
                                    <div className="tf-chat-list">
                                        {conversations.map(conv => (
                                            <div
                                                key={conv.id}
                                                className={`tf-chat-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
                                                onClick={(e) => handleSelectConversation(e, conv.id)}
                                            >
                                                <span className="tf-chat-icon">💬</span>
                                                <span className="tf-chat-title">
                                                    {conv.title || "新对话"}
                                                </span>
                                                {conv.messages && conv.messages.length > 0 && (
                                                    <span className="tf-chat-count">{conv.messages.length}</span>
                                                )}
                                                {/* <button className="tf-chat-del" onClick={(e) => handleDeleteChat(e, conv.id)}>🗑</button> */}
                                            </div>
                                        ))}
                                    </div>
                                    <button className="tf-btn-new-chat" onClick={handleNewChat}>
                                        <span className="plus-icon">+</span> 新建对话
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

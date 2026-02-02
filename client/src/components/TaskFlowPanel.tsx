import { useEffect, useState } from 'react';
import { useProjectStore } from '../stores/projectStore';
import type { TaskDefinition } from '../services/api';
import './TaskFlowPanel.css';

interface TaskFlowPanelProps {
    conversationId: string | null;
}

export default function TaskFlowPanel({ conversationId }: TaskFlowPanelProps) {
    const {
        currentProject,
        templates,
        reminders,
        loading,
        loadProjects,
        loadTemplates,
        createProject,
        loadReminders,
        markReminderRead,
        updateTaskProgress
    } = useProjectStore();

    const [showProjectSelect, setShowProjectSelect] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [projectTitle, setProjectTitle] = useState('');

    useEffect(() => {
        loadProjects();
        loadTemplates();
        loadReminders();
    }, [loadProjects, loadTemplates, loadReminders]);

    // 获取任务列表
    const tasks: TaskDefinition[] = currentProject?.template?.tasks || [];
    const progress = currentProject?.progress || [];

    const getTaskStatus = (taskIndex: number) => {
        const p = progress.find(p => p.taskIndex === taskIndex);
        return p?.status || 'PENDING';
    };

    const getTaskAIRatio = (taskIndex: number) => {
        const p = progress.find(p => p.taskIndex === taskIndex);
        return p ? Math.round(p.aiRatio * 100) : 0;
    };

    const handleCreateProject = async () => {
        if (!selectedTemplateId) return;
        try {
            await createProject(selectedTemplateId, projectTitle || undefined, conversationId || undefined);
            setShowProjectSelect(false);
            setProjectTitle('');
        } catch (err) {
            console.error('Create project failed:', err);
        }
    };

    const handleCompleteTask = async (taskIndex: number) => {
        await updateTaskProgress(taskIndex, { status: 'COMPLETED' });
    };

    const handleStartTask = async (taskIndex: number) => {
        await updateTaskProgress(taskIndex, { status: 'IN_PROGRESS' });
    };

    // 计算当前阶段
    const currentTaskIndex = currentProject?.currentTask || 0;
    const currentTask = tasks[currentTaskIndex];
    const currentPhase = currentTask?.phase || 1;

    // 按阶段分组任务
    const phases = tasks.reduce((acc, task, index) => {
        if (!acc[task.phase]) acc[task.phase] = [];
        acc[task.phase].push({ ...task, index });
        return acc;
    }, {} as Record<number, (TaskDefinition & { index: number })[]>);

    const phaseNames: Record<number, string> = {
        1: '概念阶段',
        2: '设计阶段',
        3: '整合阶段'
    };

    return (
        <div className="task-flow-panel">
            <div className="task-flow-header">
                <h3>📋 任务流程</h3>
                {!currentProject && (
                    <button
                        className="btn-start-project"
                        onClick={() => setShowProjectSelect(true)}
                    >
                        开始项目
                    </button>
                )}
            </div>

            {/* 未读提醒 */}
            {reminders.length > 0 && (
                <div className="reminders-section">
                    {reminders.map(reminder => (
                        <div
                            key={reminder.id}
                            className={`reminder-item reminder-${reminder.type.toLowerCase()}`}
                        >
                            <div className="reminder-header">
                                <span className="reminder-icon">
                                    {reminder.type === 'ENCOURAGE' ? '💪' :
                                        reminder.type === 'AI_WARNING' ? '⚠️' :
                                            reminder.type === 'IDLE_WARNING' ? '⏰' : '💬'}
                                </span>
                                <span className="reminder-type">
                                    {reminder.type === 'ENCOURAGE' ? '鼓励' :
                                        reminder.type === 'AI_WARNING' ? 'AI使用提醒' :
                                            reminder.type === 'IDLE_WARNING' ? '进度提醒' : '消息'}
                                </span>
                                <button
                                    className="btn-dismiss"
                                    onClick={() => markReminderRead(reminder.id)}
                                >
                                    ✕
                                </button>
                            </div>
                            <p className="reminder-message">{reminder.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* 项目选择弹窗 */}
            {showProjectSelect && (
                <div className="project-select-modal">
                    <div className="project-select-content">
                        <h4>开始新项目</h4>
                        <div className="form-group">
                            <label>选择模板</label>
                            <select
                                value={selectedTemplateId}
                                onChange={e => setSelectedTemplateId(e.target.value)}
                            >
                                <option value="">请选择...</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>项目标题（可选）</label>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={e => setProjectTitle(e.target.value)}
                                placeholder="我的互动叙事设计"
                            />
                        </div>
                        <div className="form-actions">
                            <button onClick={() => setShowProjectSelect(false)}>取消</button>
                            <button
                                className="btn-primary"
                                onClick={handleCreateProject}
                                disabled={!selectedTemplateId || loading}
                            >
                                {loading ? '创建中...' : '创建项目'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 任务流程视图 */}
            {currentProject && (
                <div className="task-flow-content">
                    <div className="project-info">
                        <span className="project-title">
                            {currentProject.title || currentProject.template?.name}
                        </span>
                        <span className={`project-status status-${currentProject.status.toLowerCase()}`}>
                            {currentProject.status === 'COMPLETED' ? '已完成' : '进行中'}
                        </span>
                    </div>

                    {/* 当前任务提示 */}
                    {currentTask && (
                        <div className="current-task-prompt">
                            <div className="prompt-header">
                                <span className="prompt-icon">💡</span>
                                <span className="prompt-title">当前任务提示</span>
                            </div>
                            {currentTask.softPrompts.map((prompt, i) => (
                                <p key={i} className="soft-prompt">{prompt}</p>
                            ))}
                            <div className="suggested-ai">
                                建议使用 <strong>{currentTask.suggestedAICount}</strong> 个 AI 辅助
                            </div>
                        </div>
                    )}

                    {/* 阶段和任务列表 */}
                    <div className="phases-list">
                        {Object.entries(phases).map(([phase, phaseTasks]) => (
                            <div
                                key={phase}
                                className={`phase-group ${Number(phase) === currentPhase ? 'phase-current' : ''}`}
                            >
                                <div className="phase-header">
                                    <span className="phase-name">{phaseNames[Number(phase)] || `阶段 ${phase}`}</span>
                                    <span className="phase-progress">
                                        {phaseTasks.filter(t => getTaskStatus(t.index) === 'COMPLETED').length}/{phaseTasks.length}
                                    </span>
                                </div>
                                <div className="tasks-list">
                                    {phaseTasks.map(task => {
                                        const status = getTaskStatus(task.index);
                                        const aiRatio = getTaskAIRatio(task.index);
                                        const isCurrent = task.index === currentTaskIndex;

                                        return (
                                            <div
                                                key={task.index}
                                                className={`task-item task-${status.toLowerCase()} ${isCurrent ? 'task-current' : ''}`}
                                            >
                                                <div className="task-status-icon">
                                                    {status === 'COMPLETED' ? '✅' :
                                                        status === 'IN_PROGRESS' ? '🔄' : '⏳'}
                                                </div>
                                                <div className="task-info">
                                                    <div className="task-name">{task.name}</div>
                                                    <div className="task-desc">{task.description}</div>
                                                    {status !== 'PENDING' && (
                                                        <div className="task-ai-ratio">
                                                            AI占比: <span className={aiRatio > 70 ? 'ratio-high' : aiRatio > 40 ? 'ratio-medium' : 'ratio-low'}>{aiRatio}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="task-actions">
                                                    {status === 'PENDING' && task.index === currentTaskIndex && (
                                                        <button
                                                            className="btn-start"
                                                            onClick={() => handleStartTask(task.index)}
                                                        >
                                                            开始
                                                        </button>
                                                    )}
                                                    {status === 'IN_PROGRESS' && (
                                                        <button
                                                            className="btn-complete"
                                                            onClick={() => handleCompleteTask(task.index)}
                                                        >
                                                            完成
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 无项目提示 */}
            {!currentProject && !showProjectSelect && (
                <div className="no-project-hint">
                    <p>📝 点击"开始项目"创建互动叙事设计项目</p>
                    <p>任务流程将引导你完成设计过程</p>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import './TeacherDashboard.css';

// API 类型
interface StudentStatus {
    projectId: string;
    student: { id: string; name: string };
    projectTitle: string | null;
    currentPhase: number;
    currentTask: number;
    totalTasks: number;
    completedTasks: number;
    aiRatio: number;
    activityStatus: 'active' | 'idle' | 'stuck';
    idleMinutes: number;
    status: string;
}

interface DashboardData {
    totalStudents: number;
    activeCount: number;
    idleCount: number;
    stuckCount: number;
    students: StudentStatus[];
}

interface TaskAnalytics {
    taskIndex: number;
    avgDurationMinutes: number;
    avgAiRatio: number;
    completedCount: number;
}

interface AnalyticsData {
    totalProjects: number;
    completedProjects: number;
    taskAnalytics: TaskAnalytics[];
    activityStats: { action: string; count: number }[];
}

const API_BASE = 'http://localhost:3001/api';

export default function TeacherDashboard() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'realtime' | 'analytics'>('realtime');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<StudentStatus | null>(null);
    const [reminderMessage, setReminderMessage] = useState('');
    const [reminderType, setReminderType] = useState<string>('GENERAL');
    const [showReminderModal, setShowReminderModal] = useState(false);

    // 获取 token
    const getToken = () => localStorage.getItem('token');

    // 加载仪表盘数据
    const loadDashboard = async () => {
        try {
            const response = await fetch(`${API_BASE}/teacher/dashboard`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDashboard(data);
            }
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    };

    // 加载分析数据
    const loadAnalytics = async () => {
        try {
            const response = await fetch(`${API_BASE}/teacher/analytics`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    };

    // 发送提醒
    const sendReminder = async () => {
        if (!selectedStudent || !reminderMessage.trim()) return;

        try {
            const response = await fetch(`${API_BASE}/teacher/reminder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    studentId: selectedStudent.student.id,
                    projectId: selectedStudent.projectId,
                    message: reminderMessage,
                    type: reminderType
                })
            });

            if (response.ok) {
                setShowReminderModal(false);
                setReminderMessage('');
                setSelectedStudent(null);
                alert('提醒已发送！');
            }
        } catch (error) {
            console.error('Failed to send reminder:', error);
        }
    };

    useEffect(() => {
        if (user?.role !== 'TEACHER') {
            navigate('/');
            return;
        }

        setLoading(true);
        Promise.all([loadDashboard(), loadAnalytics()]).finally(() => {
            setLoading(false);
        });

        // 每 30 秒刷新一次
        const interval = setInterval(loadDashboard, 30000);
        return () => clearInterval(interval);
    }, [user, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // 状态颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'idle': return '#f59e0b';
            case 'stuck': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    // AI 占比颜色
    const getAIRatioColor = (ratio: number) => {
        if (ratio > 70) return '#ef4444';
        if (ratio > 40) return '#f59e0b';
        return '#10b981';
    };

    // 任务名称映射
    const taskNames = [
        '核心概念', '世界观设定', '角色系统', '剧情线设计',
        '交互节点', '对白设计', '整合与迭代'
    ];

    if (loading) {
        return (
            <div className="teacher-dashboard loading">
                <div className="loading-spinner">加载中...</div>
            </div>
        );
    }

    return (
        <div className="teacher-dashboard">
            {/* 顶部导航 */}
            <header className="dashboard-header">
                <div className="header-left">
                    <span className="logo">🎓 AIMind Studio 教师控制台</span>
                </div>
                <div className="header-right">
                    <span className="user-name">👨‍🏫 {user?.name}</span>
                    <button className="btn-switch" onClick={() => navigate('/')}>
                        返回聊天
                    </button>
                    <button className="btn-logout" onClick={handleLogout}>
                        退出
                    </button>
                </div>
            </header>

            {/* 统计卡片 */}
            <div className="stats-cards">
                <div className="stat-card">
                    <div className="stat-value">{dashboard?.totalStudents || 0}</div>
                    <div className="stat-label">总学生数</div>
                </div>
                <div className="stat-card active">
                    <div className="stat-value">{dashboard?.activeCount || 0}</div>
                    <div className="stat-label">活跃中</div>
                </div>
                <div className="stat-card idle">
                    <div className="stat-value">{dashboard?.idleCount || 0}</div>
                    <div className="stat-label">待机中</div>
                </div>
                <div className="stat-card stuck">
                    <div className="stat-value">{dashboard?.stuckCount || 0}</div>
                    <div className="stat-label">可能卡住</div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div className="tab-nav">
                <button
                    className={activeTab === 'realtime' ? 'active' : ''}
                    onClick={() => setActiveTab('realtime')}
                >
                    📊 实时监控
                </button>
                <button
                    className={activeTab === 'analytics' ? 'active' : ''}
                    onClick={() => setActiveTab('analytics')}
                >
                    📈 数据分析
                </button>
            </div>

            {/* 内容区 */}
            <div className="dashboard-content">
                {activeTab === 'realtime' && (
                    <div className="realtime-panel">
                        <table className="student-table">
                            <thead>
                                <tr>
                                    <th>学生</th>
                                    <th>项目</th>
                                    <th>当前任务</th>
                                    <th>进度</th>
                                    <th>AI占比</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard?.students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="empty-message">
                                            暂无学生项目数据
                                        </td>
                                    </tr>
                                ) : (
                                    dashboard?.students.map(student => (
                                        <tr key={student.projectId}>
                                            <td className="student-name">{student.student.name}</td>
                                            <td className="project-title">{student.projectTitle || '未命名'}</td>
                                            <td className="current-task">
                                                {taskNames[student.currentTask] || `任务 ${student.currentTask + 1}`}
                                            </td>
                                            <td className="progress">
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${(student.completedTasks / student.totalTasks) * 100}%` }}
                                                    />
                                                </div>
                                                <span>{student.completedTasks}/{student.totalTasks}</span>
                                            </td>
                                            <td className="ai-ratio">
                                                <span style={{ color: getAIRatioColor(student.aiRatio) }}>
                                                    {student.aiRatio}%
                                                </span>
                                            </td>
                                            <td className="status">
                                                <span
                                                    className="status-badge"
                                                    style={{ background: getStatusColor(student.activityStatus) }}
                                                >
                                                    {student.activityStatus === 'active' ? '活跃' :
                                                        student.activityStatus === 'idle' ? `待机 ${student.idleMinutes}分钟` :
                                                            `卡住 ${student.idleMinutes}分钟`}
                                                </span>
                                            </td>
                                            <td className="actions">
                                                <button
                                                    className="btn-remind"
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        setShowReminderModal(true);
                                                    }}
                                                >
                                                    💬 提醒
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="analytics-panel">
                        <div className="analytics-grid">
                            {/* 项目完成率 */}
                            <div className="analytics-card">
                                <h3>📊 项目概览</h3>
                                <div className="analytics-stat">
                                    <span className="big-number">{analytics?.completedProjects || 0}</span>
                                    <span className="label">/ {analytics?.totalProjects || 0} 已完成</span>
                                </div>
                            </div>

                            {/* 任务分析 */}
                            <div className="analytics-card wide">
                                <h3>📋 任务统计</h3>
                                <div className="task-stats">
                                    {analytics?.taskAnalytics.map(task => (
                                        <div key={task.taskIndex} className="task-stat-item">
                                            <div className="task-name">{taskNames[task.taskIndex]}</div>
                                            <div className="task-metrics">
                                                <span>完成: {task.completedCount}人</span>
                                                <span>平均用时: {task.avgDurationMinutes}分钟</span>
                                                <span style={{ color: getAIRatioColor(task.avgAiRatio) }}>
                                                    AI占比: {task.avgAiRatio}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analytics?.taskAnalytics || analytics.taskAnalytics.length === 0) && (
                                        <div className="empty-message">暂无任务统计数据</div>
                                    )}
                                </div>
                            </div>

                            {/* 活动统计 */}
                            <div className="analytics-card">
                                <h3>📈 活动统计</h3>
                                <div className="activity-stats">
                                    {analytics?.activityStats.map(stat => (
                                        <div key={stat.action} className="activity-item">
                                            <span className="action-name">{stat.action}</span>
                                            <span className="action-count">{stat.count}</span>
                                        </div>
                                    ))}
                                    {(!analytics?.activityStats || analytics.activityStats.length === 0) && (
                                        <div className="empty-message">暂无活动数据</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 提醒弹窗 */}
            {showReminderModal && selectedStudent && (
                <div className="modal-overlay">
                    <div className="reminder-modal">
                        <h3>发送提醒给 {selectedStudent.student.name}</h3>

                        <div className="form-group">
                            <label>提醒类型</label>
                            <select
                                value={reminderType}
                                onChange={e => setReminderType(e.target.value)}
                            >
                                <option value="GENERAL">一般消息</option>
                                <option value="ENCOURAGE">鼓励</option>
                                <option value="AI_WARNING">AI使用提醒</option>
                                <option value="IDLE_WARNING">进度提醒</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>消息内容</label>
                            <textarea
                                value={reminderMessage}
                                onChange={e => setReminderMessage(e.target.value)}
                                placeholder="输入提醒内容..."
                                rows={4}
                            />
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => setShowReminderModal(false)}>取消</button>
                            <button
                                className="btn-primary"
                                onClick={sendReminder}
                                disabled={!reminderMessage.trim()}
                            >
                                发送
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

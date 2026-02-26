import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from 'react-i18next';
import type { Project, TaskTemplate } from '../services/api';
import './ProjectListPage.css';

export default function ProjectListPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { projects, templates, loading, loadProjects, loadTemplates, createProject, setCurrentProject } = useProjectStore();
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
    const [projectTitle, setProjectTitle] = useState('');
    const [creating, setCreating] = useState(false);

    const toggleLanguage = () => {
        i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');
    };

    useEffect(() => {
        loadProjects();
        loadTemplates();
    }, [loadProjects, loadTemplates]);

    const handleOpenProject = (project: Project) => {
        setCurrentProject(project);
        navigate('/chat');
    };

    const handleCreateProject = async () => {
        if (!selectedTemplate) return;
        setCreating(true);
        try {
            const project = await createProject(
                selectedTemplate.id,
                projectTitle || `${selectedTemplate.name} - ${new Date().toLocaleDateString('zh-CN')}`
            );
            setShowNewProjectModal(false);
            setSelectedTemplate(null);
            setProjectTitle('');
            setCurrentProject(project);
            navigate('/chat');
        } catch (err) {
            console.error('创建项目失败', err);
        } finally {
            setCreating(false);
        }
    };

    const getProgressPercent = (project: Project) => {
        const total = project.template?.tasks?.length || 1;
        const done = project.progress?.filter(p => p.status === 'COMPLETED').length || 0;
        return Math.round((done / total) * 100);
    };

    const getCurrentTaskName = (project: Project) => {
        const tasks = project.template?.tasks;
        if (!tasks || tasks.length === 0) return t('projectList.noTasks');
        const idx = project.currentTask < tasks.length ? project.currentTask : tasks.length - 1;
        return tasks[idx]?.name || t('projectList.noTasks');
    };

    const formatDate = (str: string) => {
        const d = new Date(str);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffH = Math.floor(diffMs / 3600000);
        if (diffH < 1) return t('projectList.timeAgo.justNow');
        if (diffH < 24) return t('projectList.timeAgo.hoursAgo', { count: diffH });
        const diffD = Math.floor(diffH / 24);
        if (diffD < 7) return t('projectList.timeAgo.daysAgo', { count: diffD });
        return d.toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'zh-CN');
    };

    return (
        <div className="project-list-page">
            {/* Header */}
            <header className="pl-header">
                <div className="pl-header-left">
                    <span className="pl-logo-icon">🤖</span>
                    <span className="pl-logo-text">AIMind Studio</span>
                    <span className="pl-tagline">{t('chatPage.logoSubtitle')}</span>
                </div>
                <div className="pl-header-right">
                    <button className="pl-btn-lang" onClick={toggleLanguage}>
                        {i18n.language === 'en' ? '中' : 'EN'}
                    </button>
                    <div className="pl-user-badge">
                        <span className="pl-user-avatar">📚</span>
                        <span className="pl-user-name">{user?.name}</span>
                    </div>
                    <button className="pl-btn-logout" onClick={logout}>{t('common.logout')}</button>
                </div>
            </header>

            {/* Main */}
            <main className="pl-main">
                <div className="pl-section-header">
                    <div>
                        <h1 className="pl-section-title">{t('projectList.title')}</h1>
                        <p className="pl-section-sub">{t('projectList.subtitle')}</p>
                    </div>
                    <button
                        className="pl-btn-new"
                        onClick={() => setShowNewProjectModal(true)}
                    >
                        <span>＋</span> {t('projectList.newProject')}
                    </button>
                </div>

                {loading && projects.length === 0 ? (
                    <div className="pl-loading">
                        <span className="pl-spinner" />
                        <span>{t('projectList.loadingProjects')}</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="pl-empty">
                        <span className="pl-empty-icon">🎮</span>
                        <p className="pl-empty-title">{t('projectList.noProjects')}</p>
                        <p className="pl-empty-sub">{t('projectList.startJourney')}</p>
                        <button
                            className="pl-btn-new"
                            onClick={() => setShowNewProjectModal(true)}
                        >
                            ＋ {t('projectList.newProject')}
                        </button>
                    </div>
                ) : (
                    <div className="pl-projects-grid">
                        {projects.map(project => {
                            const pct = getProgressPercent(project);
                            const taskName = getCurrentTaskName(project);
                            return (
                                <div
                                    key={project.id}
                                    className={`pl-project-card ${project.status === 'COMPLETED' ? 'completed' : ''}`}
                                    onClick={() => handleOpenProject(project)}
                                >
                                    <div className="pl-card-header">
                                        <span className="pl-card-icon">
                                            {project.status === 'COMPLETED' ? '✅' : '🎯'}
                                        </span>
                                        <span className={`pl-status-badge ${project.status === 'COMPLETED' ? 'done' : 'active'}`}>
                                            {project.status === 'COMPLETED' ? t('projectList.completed') : t('projectList.inProgress')}
                                        </span>
                                    </div>

                                    <h3 className="pl-card-title">
                                        {project.title || project.template?.name || t('projectList.noNameProject')}
                                    </h3>

                                    <p className="pl-card-template">
                                        📋 {project.template?.name || t('projectList.unknownTemplate')}
                                    </p>

                                    <div className="pl-card-task">
                                        <span className="pl-task-label">{t('projectList.currentStage')}</span>
                                        <span className="pl-task-name">{taskName}</span>
                                    </div>

                                    <div className="pl-progress-bar-wrap">
                                        <div className="pl-progress-bar">
                                            <div
                                                className="pl-progress-fill"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="pl-progress-text">{pct}%</span>
                                    </div>

                                    <div className="pl-card-footer">
                                        <span className="pl-last-mod">
                                            🕐 {t('projectList.lastModified')} {formatDate(project.updatedAt)}
                                        </span>
                                        <span className="pl-open-hint">{t('projectList.clickToEnter')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="pl-modal-overlay" onClick={() => setShowNewProjectModal(false)}>
                    <div className="pl-modal" onClick={e => e.stopPropagation()}>
                        <div className="pl-modal-header">
                            <h2>{t('newProjectModal.title')}</h2>
                            <button className="pl-modal-close" onClick={() => setShowNewProjectModal(false)}>✕</button>
                        </div>

                        <div className="pl-modal-body">
                            <div className="pl-form-group">
                                <label className="pl-form-label">{t('newProjectModal.nameLabel')}</label>
                                <input
                                    className="pl-form-input"
                                    type="text"
                                    placeholder={t('newProjectModal.namePlaceholder')}
                                    value={projectTitle}
                                    onChange={e => setProjectTitle(e.target.value)}
                                />
                            </div>

                            <div className="pl-form-group">
                                <label className="pl-form-label">{t('newProjectModal.templateLabel')}</label>
                                {templates.length === 0 ? (
                                    <p className="pl-no-templates">{t('newProjectModal.noTemplates')}</p>
                                ) : (
                                    <div className="pl-template-list">
                                        {templates.map((tItem: TaskTemplate) => (
                                            <div
                                                key={tItem.id}
                                                className={`pl-template-card ${selectedTemplate?.id === tItem.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedTemplate(tItem)}
                                            >
                                                <div className="pl-tpl-header">
                                                    <span className="pl-tpl-icon">🗺️</span>
                                                    <span className="pl-tpl-name">{tItem.name}</span>
                                                    {selectedTemplate?.id === tItem.id && (
                                                        <span className="pl-tpl-check">✓</span>
                                                    )}
                                                </div>
                                                {tItem.description && (
                                                    <p className="pl-tpl-desc">{tItem.description}</p>
                                                )}
                                                <p className="pl-tpl-meta">
                                                    {tItem.tasks?.length || 0} {t('newProjectModal.taskStages')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pl-modal-footer">
                            <button
                                className="pl-btn-cancel"
                                onClick={() => setShowNewProjectModal(false)}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="pl-btn-create"
                                onClick={handleCreateProject}
                                disabled={!selectedTemplate || creating}
                            >
                                {creating ? t('newProjectModal.creating') : t('newProjectModal.createBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

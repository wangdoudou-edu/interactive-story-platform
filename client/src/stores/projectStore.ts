import { create } from 'zustand';
import type { Project, TaskTemplate, TeacherReminder } from '../services/api';
import { projectApi } from '../services/api';

interface ProjectState {
    // 状态
    projects: Project[];
    currentProject: Project | null;
    templates: TaskTemplate[];
    reminders: TeacherReminder[];
    loading: boolean;
    error: string | null;

    // 动作
    loadProjects: () => Promise<void>;
    loadTemplates: () => Promise<void>;
    createProject: (templateId: string, title?: string, conversationId?: string) => Promise<Project>;
    setCurrentProject: (project: Project | null) => void;
    loadProject: (id: string) => Promise<void>;
    updateTaskProgress: (taskIndex: number, data: {
        studentContent?: string;
        aiContent?: string;
        status?: 'IN_PROGRESS' | 'COMPLETED';
    }) => Promise<void>;
    logAICompare: (aiConfigs: string[], taskIndex: number, selectedAiId?: string) => Promise<void>;
    loadReminders: () => Promise<void>;
    markReminderRead: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    templates: [],
    reminders: [],
    loading: false,
    error: null,

    loadProjects: async () => {
        set({ loading: true, error: null });
        try {
            const projects = await projectApi.getAll();
            set({ projects, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    loadTemplates: async () => {
        try {
            const templates = await projectApi.getTemplates();
            set({ templates });
        } catch (err) {
            console.error('Failed to load templates:', err);
        }
    },

    createProject: async (templateId: string, title?: string, conversationId?: string) => {
        set({ loading: true, error: null });
        try {
            const project = await projectApi.create({ templateId, title, conversationId });
            set(state => ({
                projects: [project, ...state.projects],
                currentProject: project,
                loading: false
            }));
            return project;
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
            throw err;
        }
    },

    setCurrentProject: (project: Project | null) => {
        set({ currentProject: project });
    },

    loadProject: async (id: string) => {
        set({ loading: true, error: null });
        try {
            const project = await projectApi.get(id);
            set({ currentProject: project, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    updateTaskProgress: async (taskIndex: number, data) => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
            const progress = await projectApi.updateProgress(currentProject.id, taskIndex, data);

            // 更新本地状态
            set(state => {
                if (!state.currentProject) return state;

                const newProgress = state.currentProject.progress ? [...state.currentProject.progress] : [];
                const idx = newProgress.findIndex(p => p.taskIndex === taskIndex);
                if (idx >= 0) {
                    newProgress[idx] = progress;
                } else {
                    newProgress.push(progress);
                }

                return {
                    currentProject: {
                        ...state.currentProject,
                        progress: newProgress,
                        currentTask: progress.status === 'COMPLETED' ? taskIndex + 1 : state.currentProject.currentTask
                    }
                };
            });
        } catch (err) {
            console.error('Failed to update progress:', err);
        }
    },

    logAICompare: async (aiConfigs: string[], taskIndex: number, selectedAiId?: string) => {
        const { currentProject } = get();
        if (!currentProject) return;

        try {
            await projectApi.logCompare(currentProject.id, { aiConfigs, taskIndex, selectedAiId });
        } catch (err) {
            console.error('Failed to log AI compare:', err);
        }
    },

    loadReminders: async () => {
        try {
            const reminders = await projectApi.getUnreadReminders();
            set({ reminders });
        } catch (err) {
            console.error('Failed to load reminders:', err);
        }
    },

    markReminderRead: async (id: string) => {
        try {
            await projectApi.markReminderRead(id);
            set(state => ({
                reminders: state.reminders.filter(r => r.id !== id)
            }));
        } catch (err) {
            console.error('Failed to mark reminder read:', err);
        }
    },
}));

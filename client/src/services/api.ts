// API 服务配置
const API_BASE = 'http://localhost:3001/api';

// 获取存储的 token
const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// 通用请求函数
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '请求失败' }));
        throw new Error(error.error || '请求失败');
    }

    return response.json();
}

// 用户类型
export interface User {
    id: string;
    username: string;
    name: string;
    role: 'STUDENT' | 'TEACHER';
}

// 认证相关 API
export const authApi = {
    login: async (username: string, password: string) => {
        const result = await request<{ user: User; token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        localStorage.setItem('token', result.token);
        return result;
    },

    register: async (username: string, password: string, name: string, role?: string) => {
        const result = await request<{ user: User; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, name, role }),
        });
        localStorage.setItem('token', result.token);
        return result;
    },

    logout: async () => {
        await request('/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
    },

    getMe: async () => {
        return request<User>('/auth/me');
    },
};

// AI 配置类型
export interface AIConfig {
    id: string;
    name: string;
    provider: string;
    model: string;
    avatar?: string;
    description?: string;
}

// 消息类型
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    aiConfigId?: string;
    aiConfig?: AIConfig;
    createdAt: string;
}

// 对话类型
export interface Conversation {
    id: string;
    title?: string;
    createdAt: string;
    updatedAt: string;
    messages?: Message[];
}

// 对话相关 API
export const conversationApi = {
    list: async () => {
        return request<Conversation[]>('/conversations');
    },

    get: async (id: string) => {
        return request<Conversation>(`/conversations/${id}`);
    },

    create: async (title?: string) => {
        return request<Conversation>('/conversations', {
            method: 'POST',
            body: JSON.stringify({ title }),
        });
    },

    sendMessage: async (conversationId: string, content: string, aiConfigIds: string[]) => {
        return request<{ userMessage: Message; assistantMessages: Message[] }>(
            `/conversations/${conversationId}/messages`,
            {
                method: 'POST',
                body: JSON.stringify({ content, aiConfigIds }),
            }
        );
    },

    delete: async (id: string) => {
        return request<{ success: boolean }>(`/conversations/${id}`, {
            method: 'DELETE',
        });
    },
};

// AI 配置相关 API
export const aiApi = {
    getConfigs: async () => {
        return request<AIConfig[]>('/ai/configs');
    },

    getProviders: async () => {
        return request<string[]>('/ai/providers');
    },

    createConfig: async (config: Omit<AIConfig, 'id'>) => {
        return request<AIConfig>('/ai/configs', {
            method: 'POST',
            body: JSON.stringify(config),
        });
    },
};

// 批注类型
export interface Annotation {
    id: string;
    messageId: string;
    userId: string;
    selectedText: string;
    type: 'KNOWLEDGE' | 'DELETE' | 'COMMENT';
    label?: 'DOUBT' | 'INSPIRATION' | 'QUESTION' | 'NOTE';
    note?: string;
    startOffset: number;
    endOffset: number;
    isDeleted: boolean;
    createdAt: string;
}

// 批注相关 API
export const annotationApi = {
    getByMessage: async (messageId: string) => {
        return request<Annotation[]>(`/annotations/message/${messageId}`);
    },

    create: async (data: {
        messageId: string;
        selectedText: string;
        type: string;
        label?: string;
        note?: string;
        startOffset: number;
        endOffset: number;
    }) => {
        return request<Annotation>('/annotations', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: { label?: string; note?: string; isDeleted?: boolean }) => {
        return request<Annotation>(`/annotations/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return request<{ success: boolean }>(`/annotations/${id}`, {
            method: 'DELETE',
        });
    },
};

// 笔记类型
export interface Note {
    id: string;
    userId: string;
    conversationId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

// 笔记相关 API
export const noteApi = {
    get: async (conversationId: string) => {
        return request<Note>(`/notes/${conversationId}`);
    },

    update: async (conversationId: string, content: string) => {
        return request<Note>(`/notes/${conversationId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    addKnowledge: async (conversationId: string, text: string, source: string) => {
        return request<Note>(`/notes/${conversationId}/add-knowledge`, {
            method: 'POST',
            body: JSON.stringify({ text, source }),
        });
    },
};

// 草稿类型
export interface Draft {
    id: string;
    userId: string;
    conversationId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface DraftHistory {
    id: string;
    userId: string;
    conversationId: string;
    roundNumber: number;
    content: string;
    createdAt: string;
}

// 草稿相关 API
export const draftApi = {
    get: async (conversationId: string) => {
        return request<Draft>(`/drafts/${conversationId}`);
    },

    update: async (conversationId: string, content: string) => {
        return request<Draft>(`/drafts/${conversationId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },

    organize: async (conversationId: string, data: {
        messageId: string;
        aiName: string;
        content?: string;
        annotations?: Array<{ selectedText: string; label?: string; note?: string }>;
    }) => {
        return request<Draft>(`/drafts/${conversationId}/organize`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    snapshot: async (conversationId: string) => {
        return request<DraftHistory>(`/drafts/${conversationId}/snapshot`, {
            method: 'POST',
        });
    },

    getHistory: async (conversationId: string) => {
        return request<DraftHistory[]>(`/drafts/${conversationId}/history`);
    },
};

// ==================== 任务流程相关类型和 API ====================

// 任务定义
export interface TaskDefinition {
    phase: number;
    name: string;
    description: string;
    softPrompts: string[];
    suggestedAICount: number;
}

// 任务模板
export interface TaskTemplate {
    id: string;
    name: string;
    description?: string;
    tasks: TaskDefinition[];
    isActive: boolean;
    createdAt: string;
}

// 任务进度
export interface TaskProgress {
    id: string;
    projectId: string;
    taskIndex: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    studentContent?: string;
    aiContent?: string;
    aiRatio: number;
    startedAt?: string;
    completedAt?: string;
    lastActiveAt: string;
}

// 项目
export interface Project {
    id: string;
    userId: string;
    templateId: string;
    conversationId?: string;
    title?: string;
    currentPhase: number;
    currentTask: number;
    status: 'IN_PROGRESS' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
    template?: TaskTemplate;
    progress?: TaskProgress[];
}

// 教师提醒
export interface TeacherReminder {
    id: string;
    teacherId: string;
    studentId: string;
    projectId?: string;
    message: string;
    type: 'GENERAL' | 'ENCOURAGE' | 'AI_WARNING' | 'IDLE_WARNING';
    sentAt: string;
    readAt?: string;
}

// 项目相关 API
export const projectApi = {
    // 获取当前用户的项目列表
    getAll: async () => {
        return request<Project[]>('/projects');
    },

    // 创建新项目
    create: async (data: { templateId: string; title?: string; conversationId?: string }) => {
        return request<Project>('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 获取项目详情
    get: async (id: string) => {
        return request<Project>(`/projects/${id}`);
    },

    // 更新任务进度
    updateProgress: async (projectId: string, taskIndex: number, data: {
        studentContent?: string;
        aiContent?: string;
        status?: 'IN_PROGRESS' | 'COMPLETED';
    }) => {
        return request<TaskProgress>(`/projects/${projectId}/progress/${taskIndex}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // 记录 AI 比较行为
    logCompare: async (projectId: string, data: {
        aiConfigs: string[];
        taskIndex: number;
        selectedAiId?: string;
    }) => {
        return request<{ success: boolean }>(`/projects/${projectId}/compare`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 获取可用模板
    getTemplates: async () => {
        return request<TaskTemplate[]>('/projects/templates/available');
    },

    // 获取未读提醒
    getUnreadReminders: async () => {
        return request<TeacherReminder[]>('/projects/reminders/unread');
    },

    // 标记提醒已读
    markReminderRead: async (id: string) => {
        return request<TeacherReminder>(`/projects/reminders/${id}/read`, {
            method: 'PUT',
        });
    },
};

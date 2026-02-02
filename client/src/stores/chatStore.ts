import { create } from 'zustand';
import { conversationApi, aiApi } from '../services/api';
import type { Conversation, Message, AIConfig } from '../services/api';

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    aiConfigs: AIConfig[];
    selectedAIIds: string[];
    isLoading: boolean;
    isSending: boolean;

    // Actions
    loadConversations: () => Promise<void>;
    loadAIConfigs: () => Promise<void>;
    selectConversation: (id: string) => Promise<void>;
    createConversation: (title?: string) => Promise<Conversation>;
    deleteConversation: (id: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    toggleAISelection: (aiId: string) => void;
    clearCurrentConversation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    aiConfigs: [],
    selectedAIIds: [],
    isLoading: false,
    isSending: false,

    loadConversations: async () => {
        set({ isLoading: true });
        try {
            const conversations = await conversationApi.list();
            set({ conversations, isLoading: false });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    loadAIConfigs: async () => {
        try {
            const aiConfigs = await aiApi.getConfigs();
            // 默认选中所有 AI
            const selectedAIIds = aiConfigs.map(c => c.id);
            set({ aiConfigs, selectedAIIds });
        } catch (e) {
            console.error('Failed to load AI configs:', e);
        }
    },

    selectConversation: async (id: string) => {
        set({ isLoading: true });
        try {
            const conversation = await conversationApi.get(id);
            set({
                currentConversation: conversation,
                messages: conversation.messages || [],
                isLoading: false
            });
        } catch (e) {
            set({ isLoading: false });
            throw e;
        }
    },

    createConversation: async (title?: string) => {
        const conversation = await conversationApi.create(title);
        set(state => ({
            conversations: [conversation, ...state.conversations],
            currentConversation: conversation,
            messages: []
        }));
        return conversation;
    },

    deleteConversation: async (id: string) => {
        await conversationApi.delete(id);
        const { currentConversation } = get();
        set(state => ({
            conversations: state.conversations.filter(c => c.id !== id),
            ...(currentConversation?.id === id ? {
                currentConversation: null,
                messages: []
            } : {})
        }));
    },

    sendMessage: async (content: string) => {
        const { currentConversation, selectedAIIds } = get();
        if (!currentConversation || selectedAIIds.length === 0) return;

        set({ isSending: true });

        // 先添加用户消息到本地状态
        const tempUserMessage: Message = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
        };

        set(state => ({
            messages: [...state.messages, tempUserMessage]
        }));

        try {
            const result = await conversationApi.sendMessage(
                currentConversation.id,
                content,
                selectedAIIds
            );

            // 替换临时消息并添加 AI 响应
            set(state => ({
                messages: [
                    ...state.messages.filter(m => m.id !== tempUserMessage.id),
                    result.userMessage,
                    ...result.assistantMessages
                ],
                isSending: false
            }));
        } catch (e) {
            // 移除临时消息
            set(state => ({
                messages: state.messages.filter(m => m.id !== tempUserMessage.id),
                isSending: false
            }));
            throw e;
        }
    },

    toggleAISelection: (aiId: string) => {
        set(state => ({
            selectedAIIds: state.selectedAIIds.includes(aiId)
                ? state.selectedAIIds.filter(id => id !== aiId)
                : [...state.selectedAIIds, aiId]
        }));
    },

    clearCurrentConversation: () => {
        set({ currentConversation: null, messages: [] });
    },
}));

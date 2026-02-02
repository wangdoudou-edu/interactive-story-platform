import { create } from 'zustand';
import { annotationApi, noteApi, draftApi } from '../services/api';
import type { Annotation } from '../services/api';

interface AnnotationState {
    annotations: Map<string, Annotation[]>; // messageId -> annotations
    isLoading: boolean;

    // Actions
    loadAnnotations: (messageId: string) => Promise<void>;
    addAnnotation: (data: {
        messageId: string;
        selectedText: string;
        type: 'KNOWLEDGE' | 'DELETE' | 'COMMENT';
        label?: string;
        note?: string;
        startOffset: number;
        endOffset: number;
    }) => Promise<Annotation>;
    updateAnnotation: (id: string, data: { label?: string; note?: string; isDeleted?: boolean }) => Promise<void>;
    deleteAnnotation: (id: string, messageId: string) => Promise<void>;
    addToNote: (conversationId: string, text: string, source: string) => Promise<void>;
    organizeToDraft: (conversationId: string, messageId: string, aiName: string, annotations: Array<{ selectedText: string; label?: string; note?: string }>) => Promise<void>;
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
    annotations: new Map(),
    isLoading: false,

    loadAnnotations: async (messageId: string) => {
        try {
            const annotations = await annotationApi.getByMessage(messageId);
            set(state => {
                const newMap = new Map(state.annotations);
                newMap.set(messageId, annotations);
                return { annotations: newMap };
            });
        } catch (error) {
            console.error('Load annotations error:', error);
        }
    },

    addAnnotation: async (data) => {
        set({ isLoading: true });
        try {
            const annotation = await annotationApi.create(data);
            set(state => {
                const newMap = new Map(state.annotations);
                const existing = newMap.get(data.messageId) || [];
                newMap.set(data.messageId, [...existing, annotation]);
                return { annotations: newMap, isLoading: false };
            });
            return annotation;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    updateAnnotation: async (id, data) => {
        try {
            const updated = await annotationApi.update(id, data);
            set(state => {
                const newMap = new Map(state.annotations);
                for (const [msgId, anns] of newMap) {
                    const idx = anns.findIndex(a => a.id === id);
                    if (idx !== -1) {
                        anns[idx] = updated;
                        newMap.set(msgId, [...anns]);
                        break;
                    }
                }
                return { annotations: newMap };
            });
        } catch (error) {
            console.error('Update annotation error:', error);
        }
    },

    deleteAnnotation: async (id, messageId) => {
        try {
            await annotationApi.delete(id);
            set(state => {
                const newMap = new Map(state.annotations);
                const existing = newMap.get(messageId) || [];
                newMap.set(messageId, existing.filter(a => a.id !== id));
                return { annotations: newMap };
            });
        } catch (error) {
            console.error('Delete annotation error:', error);
        }
    },

    addToNote: async (conversationId, text, source) => {
        try {
            await noteApi.addKnowledge(conversationId, text, source);
        } catch (error) {
            console.error('Add to note error:', error);
        }
    },

    organizeToDraft: async (conversationId, messageId, aiName, annotations) => {
        try {
            await draftApi.organize(conversationId, { messageId, aiName, annotations });
        } catch (error) {
            console.error('Organize error:', error);
        }
    },
}));

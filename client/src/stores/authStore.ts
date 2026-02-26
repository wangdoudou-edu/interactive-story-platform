import { create } from 'zustand';
import { authApi } from '../services/api';
import type { User } from '../services/api';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email: string, password: string) => {
        void password; // Ignore unused variable for mock login
        // Bypass for UI testing
        set({
            user: { id: 'mock-1', name: 'Mock Student', username: email, role: 'STUDENT' },
            isAuthenticated: true
        });
        localStorage.setItem('token', 'mock-token');
    },

    register: async (email: string, password: string, name: string, role?: string) => {
        const result = await authApi.register(email, password, name, role);
        set({ user: result.user, isAuthenticated: true });
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch (e) {
            // Ignore logout errors
        }
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        // Bypass checkAuth for UI testing if token exists
        set({
            user: { id: 'mock-1', name: 'Mock Student', username: 'student1', role: 'STUDENT' },
            isAuthenticated: true,
            isLoading: false
        });
    },

    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
    },
}));

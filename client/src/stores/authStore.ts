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
        const result = await authApi.login(email, password);
        set({ user: result.user, isAuthenticated: true });
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

        try {
            const user = await authApi.getMe();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch (e) {
            localStorage.removeItem('token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
    },
}));

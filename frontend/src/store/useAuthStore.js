import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,
    error: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check");
            set({ authUser: res.data.user });
        } catch (error) {
            set({ authUser: null, error: error.response?.data?.message || "Failed to check auth" });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    register: async (credentials) => {
        try {
            set({ error: null });
            const res = await axiosInstance.post("/auth/register", credentials);
            set({ authUser: res.data.user });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || "Registration failed" });
            return false;
        }
    },

    login: async (credentials) => {
        try {
            set({ error: null });
            const res = await axiosInstance.post("/auth/login", credentials);
            set({ authUser: res.data.user });
            return true;
        } catch (error) {
            set({ error: error.response?.data?.message || "Login failed" });
            return false;
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout");
            set({ authUser: null });
        } catch (error) {
            console.error("Logout failed", error);
        }
    },
}));

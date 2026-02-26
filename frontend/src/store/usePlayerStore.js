import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const usePlayerStore = create((set, get) => ({
    currentSong: null,
    isPlaying: false,
    queue: [],
    currentIndex: -1,

    playAudio: (song, queue = [song]) => {
        const songIndex = queue.findIndex(s => s._id === song._id);
        set({
            currentSong: song,
            queue,
            currentIndex: songIndex !== -1 ? songIndex : 0,
            isPlaying: true
        });
    },

    togglePlay: () => {
        const { isPlaying, currentSong } = get();
        if (currentSong) {
            set({ isPlaying: !isPlaying });
        }
    },

    playNext: () => {
        const { queue, currentIndex } = get();
        if (currentIndex < queue.length - 1) {
            const nextSong = queue[currentIndex + 1];
            set({ currentSong: nextSong, currentIndex: currentIndex + 1, isPlaying: true });
        }
    },

    playPrevious: () => {
        const { queue, currentIndex } = get();
        if (currentIndex > 0) {
            const prevSong = queue[currentIndex - 1];
            set({ currentSong: prevSong, currentIndex: currentIndex - 1, isPlaying: true });
        }
    },
}));

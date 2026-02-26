import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle } from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";
import { useEffect, useRef, useState } from "react";

const AudioPlayer = () => {
    const { currentSong, isPlaying, playNext, playPrevious, togglePlay } = usePlayerStore();
    const audioRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);

    useEffect(() => {
        if (currentSong && audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.log("Audio play error", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [currentSong, isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Handle progress updates
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            if (duration) {
                setProgress((current / duration) * 100);
            }
        }
    };

    const handleSeek = (e) => {
        if (audioRef.current) {
            const seekTime = (e.target.value / 100) * audioRef.current.duration;
            audioRef.current.currentTime = seekTime;
            setProgress(e.target.value);
        }
    };

    const formatTime = (time) => {
        if (time && !isNaN(time)) {
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }
        return '0:00';
    };

    if (!currentSong) {
        return (
            <footer className="h-24 bg-[#181818] border-t border-[#282828] flex items-center justify-center text-textSecondary text-sm fixed bottom-0 w-full z-50">
                Select a song to play
            </footer>
        );
    }

    return (
        <footer className="h-24 bg-[#181818] border-t border-[#282828] flex items-center justify-between px-4 fixed bottom-0 w-full z-50">
            <audio
                ref={audioRef}
                src={currentSong.audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={playNext}
            />

            {/* Left: Song Info */}
            <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
                <img
                    src={currentSong.imageUrl}
                    alt={currentSong.title}
                    className="w-14 h-14 rounded shadow-lg object-cover"
                />
                <div className="flex flex-col">
                    <span className="text-white text-sm font-medium hover:underline cursor-pointer">
                        {currentSong.title}
                    </span>
                    <span className="text-xs text-textSecondary hover:underline cursor-pointer">
                        {currentSong.artist?.name || 'Unknown Artist'}
                    </span>
                </div>
            </div>

            {/* Center: Controls & Progress */}
            <div className="flex flex-col items-center max-w-[40%] w-full">
                <div className="flex items-center gap-4 mb-2">
                    <button className="text-textSecondary hover:text-white transition-colors">
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button onClick={playPrevious} className="text-textSecondary hover:text-white transition-colors">
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-1" />}
                    </button>
                    <button onClick={playNext} className="text-textSecondary hover:text-white transition-colors">
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                    <button className="text-textSecondary hover:text-white transition-colors">
                        <Repeat className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full max-w-[600px] text-xs text-textSecondary font-mono group">
                    <span>{formatTime(audioRef.current?.currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="flex-1"
                    />
                    <span>{formatTime(audioRef.current?.duration || currentSong.duration)}</span>
                </div>
            </div>

            {/* Right: Volume */}
            <div className="flex items-center justify-end gap-3 w-[30%] min-w-[180px] group">
                <Volume2 className="w-5 h-5 text-textSecondary" />
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-24 border-none"
                />
            </div>
        </footer>
    );
};

export default AudioPlayer;

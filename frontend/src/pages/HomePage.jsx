import { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';
import { Play } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

const HomePage = () => {
    const [songs, setSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { playAudio } = usePlayerStore();

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const res = await axiosInstance.get('/songs');
                setSongs(res.data.data);
            } catch (error) {
                console.error("Error fetching songs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSongs();
    }, []);

    if (isLoading) return <div className="text-white flex justify-center mt-20">Loading songs...</div>;

    return (
        <div className="text-white pb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Good afternoon</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {songs.map((song) => (
                    <div
                        key={song._id}
                        className="bg-[#181818] p-4 rounded-md hover:bg-[#282828] transition-colors group cursor-pointer"
                        onClick={() => playAudio(song, songs)}
                    >
                        <div className="relative mb-4 aspect-square">
                            <img
                                src={song.imageUrl}
                                alt={song.title}
                                className="w-full h-full object-cover rounded shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
                            />
                            <button
                                className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-xl hover:scale-105 hover:bg-green-400"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio(song, songs);
                                }}
                            >
                                <Play className="w-6 h-6 text-black fill-black ml-1" />
                            </button>
                        </div>
                        <h3 className="font-bold text-base truncate mb-1">{song.title}</h3>
                        <p className="text-textSecondary text-sm truncate">
                            {song.artist?.name || 'Unknown Artist'}
                        </p>
                    </div>
                ))}
            </div>

            {songs.length === 0 && (
                <div className="text-textSecondary mt-10 text-center">
                    No songs found. Waiting for an artist to upload some!
                </div>
            )}
        </div>
    );
};

export default HomePage;

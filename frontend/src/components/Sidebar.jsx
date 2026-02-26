import { Link, useLocation } from "react-router-dom";
import { Home, Search, Library, PlusSquare, Heart } from "lucide-react";

const Sidebar = () => {
    const location = useLocation();
    const pathname = location.pathname;

    return (
        <aside className="w-64 bg-black flex flex-col h-full border-r border-[#282828] text-textSecondary px-4 py-6 hidden md:flex">
            {/* Logo Placeholder */}
            <Link to="/" className="text-white flex items-center gap-2 font-bold text-2xl mb-8 px-2 tracking-tight">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-black text-xs font-black">S</span>
                </div>
                Spotify
            </Link>

            <nav className="flex flex-col gap-4 text-sm font-semibold mb-8">
                <Link to="/" className={`flex items-center gap-4 px-2 hover:text-white transition-colors py-1 ${pathname === '/' ? 'text-white' : ''}`}>
                    <Home className="w-6 h-6" />
                    Home
                </Link>
                <Link to="/search" className={`flex items-center gap-4 px-2 hover:text-white transition-colors py-1 ${pathname === '/search' ? 'text-white' : ''}`}>
                    <Search className="w-6 h-6" />
                    Search
                </Link>
                <Link to="/library" className={`flex items-center gap-4 px-2 hover:text-white transition-colors py-1 ${pathname === '/library' ? 'text-white' : ''}`}>
                    <Library className="w-6 h-6" />
                    Your Library
                </Link>
            </nav>

            <div className="flex flex-col gap-4 text-sm font-semibold mb-4 mt-4">
                <button className="flex items-center gap-4 px-2 hover:text-white transition-colors py-1 group">
                    <div className="bg-textSecondary group-hover:bg-white text-black p-1 rounded-sm transition-colors">
                        <PlusSquare className="w-4 h-4" />
                    </div>
                    Create Playlist
                </button>
                <Link to="/collection/tracks" className="flex items-center gap-4 px-2 hover:text-white transition-colors py-1 group">
                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-300 text-white p-1 rounded-sm opacity-70 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-4 h-4" />
                    </div>
                    Liked Songs
                </Link>
            </div>

            <hr className="border-[#282828] mx-2 my-2" />

            {/* Playlist List Placeholder */}
            <div className="flex-1 overflow-y-auto px-2 py-2 text-sm font-medium space-y-3">
                {/* Placeholder for fetching actual playlists */}
            </div>

        </aside>
    );
};

export default Sidebar;

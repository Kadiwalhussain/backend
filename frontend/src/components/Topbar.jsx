import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const Topbar = () => {
    const { authUser, logout } = useAuthStore();
    const navigate = useNavigate();

    return (
        <header className="h-16 flex items-center justify-between px-6 bg-transparent sticky top-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
            <div className="flex gap-2">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-black/50 p-1.5 rounded-full text-textSecondary hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={() => navigate(1)}
                    className="bg-black/50 p-1.5 rounded-full text-textSecondary hover:text-white transition-colors"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                {authUser ? (
                    <>
                        {authUser.role === 'artist' && (
                            <Link to="/artist/dashboard" className="text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">
                                Artist Dashboard
                            </Link>
                        )}
                        <button
                            onClick={() => logout()}
                            className="text-textSecondary hover:text-white font-semibold text-sm transition-colors py-2 px-3"
                        >
                            Log out
                        </button>
                        <div className="w-9 h-9 bg-[#282828] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3E3E3E] transition-colors relative group">
                            <UserIcon className="w-5 h-5 text-gray-300" />
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/register" className="text-textSecondary hover:text-white font-semibold text-sm transition-colors py-2 px-3">
                            Sign up
                        </Link>
                        <Link to="/login" className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-full hover:scale-105 transition-transform">
                            Log in
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Topbar;

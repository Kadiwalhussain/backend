import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AudioPlayer from "./AudioPlayer";

const MainLayout = () => {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                <Topbar />

                {/* Scrollable View */}
                <div className="flex-1 overflow-y-auto w-full">
                    <main className="mx-auto max-w-7xl pt-4 pb-28 px-4 sm:px-6 lg:px-8 h-full">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* Fixed Bottom Audio Player */}
            <AudioPlayer />
        </div>
    );
};

export default MainLayout;

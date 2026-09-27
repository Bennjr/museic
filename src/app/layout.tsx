import { Outlet } from "react-router-dom";
import Sidebar from "@components/sidebar";
import NowPlayingBar from "@components/now-playing-bar";

export default function Layout() {
    return (
        <main className="w-screen h-screen flex flex-col overflow-hidden bg-c-primary text-c-text select-none">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />

                <section className="hero flex-1 overflow-y-auto">
                    <div className="select-none pb-24">
                        <Outlet />
                    </div>
                </section>
            </div>

            <div className="fixed bottom-0 left-0 p-4 right-0 z-50">
                <NowPlayingBar />
            </div>
        </main>
    );
}
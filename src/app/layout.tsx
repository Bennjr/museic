import Sidebar from "@components/sidebar";
import NowPlayingBar from "@components/now-playing-bar";
import Decoration from "@components/decoration";
import AddButton from "@components/add";
import { Outlet } from "react-router-dom";
import Topbar from "@components/topbar";


export default function Layout() {
    return (
        <main className="w-screen h-screen flex flex-col overflow-hidden overscroll-none bg-background text-c-text select-none rounded-sm">
            <Decoration />
            <Topbar />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <section className="flex-1 overflow-hidden">
                    <Outlet />
                </section>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50">
                <NowPlayingBar />
            </div>
            <div className="fixed bottom-16 right-5 z-50">
                <AddButton></AddButton>
            </div>
        </main>
    );
}
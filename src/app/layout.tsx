import Sidebar from "@components/sidebar";
import NowPlayingBar from "@components/now-playing-bar";
import TabBar from "@components/tab-bar";
import TabContent from "@components/tab-content";
import { TabProvider } from "@components/tab-provider";
import Decoration from "@components/decoration";
import AddButton from "@components/add";

export default function Layout() {
    return (
        <TabProvider>
            <main className="w-screen h-screen flex flex-col overflow-hidden bg-background text-c-text select-none rounded-sm">
                <Decoration />

                <TabBar />

                <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <section className="flex-1 overflow-hidden">
                        <TabContent />
                    </section>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <NowPlayingBar />
                </div>
                <div className="fixed bottom-16 right-5 z-50">
                    <AddButton></AddButton>
                </div>
            </main>
        </TabProvider>
    );
}
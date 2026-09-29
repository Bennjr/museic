import { Routes, Route } from "react-router-dom";
import { X, Plus } from "lucide-react";
import { useTab } from "@components/tab-provider";

import Home from "../../app/pages/home";
import Library from "../../app/pages/library";
import Playlist from "../../app/pages/playlist";
import Account from "../../app/pages/account";

function TabRoutes({ location }: { location: string }) {
    return (
        <Routes location={location}>
            <Route index element={<Home />} />
            <Route path="library" element={<Library />} />
            <Route path="playlist" element={<Playlist />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Home />} />
        </Routes>
    );
}

export default function Tabs() {
    const { tabs, activeId, path, setActiveId, addTab, closeTab } = useTab();

    return (
        <div className="flex flex-col h-full bg-foreground">
            <div className="flex items-center gap-1 px-3 pt-2 border-b border-white/5">
                {tabs.map((tab) => {
                    const label = tab.history[tab.index] === "/" ? "Home" : tab.history[tab.index].slice(1);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveId(tab.id)}
                            className={`group flex items-center gap-2 text-sm w-full ${tab.id === activeId ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5"
                                }`}
                        >
                            <span className="truncate capitalize">{label}</span>
                            {tabs.length > 1 && (
                                <span
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100"
                                >
                                    <X className="size-3" />
                                </span>
                            )}
                        </button>
                    );
                })}
                <button onClick={() => addTab()} className="p-1.5 text-white/40 hover:text-white">
                    <Plus className="size-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <TabRoutes location={path} />
            </div>
        </div>
    );
}
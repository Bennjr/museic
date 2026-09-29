import { X, Plus } from "lucide-react";
import { useTab } from "@components/tab-provider";

export default function TabBar() {
    const { tabs, activeId, setActiveId, addTab, closeTab } = useTab();

    return (
        <div className="relative z-30 flex items-center gap-1 px-3 pt-2 pb-0 border-b border-white/5 bg-background/80 backdrop-blur-md">
            {tabs.map((tab: any) => {
                const path = tab.history[tab.index];
                const label = path === "/" ? "Home" : path.slice(1);

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveId(tab.id)}
                        className={`group flex items-center justify-between gap-2 px-3 py-1.5 text-sm w-full transition-colors ${tab.id === activeId
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:bg-white/5 hover:text-white/80"
                            }`}
                    >
                        <span className="truncate capitalize">{label}</span>
                        {tabs.length > 1 && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
                            >
                                <X className="size-3" />
                            </span>
                        )}
                    </button>
                );
            })}

            <button
                onClick={() => addTab()}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}
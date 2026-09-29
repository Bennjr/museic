import { createContext, useContext, useState, ReactNode } from "react";

export type Tab = {
    id: string;
    history: string[];
    index: number;
};

type TabContextType = {
    tabs: Tab[];
    activeId: string;
    path: string;
    setActiveId: (id: string) => void;
    navigate: (to: string) => void;
    back: () => void;
    forward: () => void;
    addTab: (path?: string) => void;
    closeTab: (id: string) => void;
};

const TabContext = createContext<TabContextType | null>(null);

export const useTab = () => {
    const ctx = useContext(TabContext);
    if (!ctx) throw new Error("useTab must be used inside TabProvider");
    return ctx;
};

export function TabProvider({ children }: { children: ReactNode }) {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: crypto.randomUUID(), history: ["/"], index: 0 },
    ]);
    const [activeId, setActiveId] = useState(tabs[0].id);

    const activeTab = tabs.find((t) => t.id === activeId)!;
    const path = activeTab.history[activeTab.index];

    const updateTab = (id: string, fn: (t: Tab) => Tab) => {
        setTabs((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));
    };

    const navigate = (to: string) => {
        updateTab(activeId, (t) => ({
            ...t,
            history: [...t.history.slice(0, t.index + 1), to],
            index: t.index + 1,
        }));
    };

    const back = () => {
        updateTab(activeId, (t) => ({
            ...t,
            index: Math.max(0, t.index - 1),
        }));
    };

    const forward = () => {
        updateTab(activeId, (t) => ({
            ...t,
            index: Math.min(t.history.length - 1, t.index + 1),
        }));
    };

    const addTab = (path = "/") => {
        const id = crypto.randomUUID();
        setTabs((prev) => [...prev, { id, history: [path], index: 0 }]);
        setActiveId(id);
    };

    const closeTab = (id: string) => {
        if (tabs.length === 1) return;
        const next = tabs.filter((t) => t.id !== id);
        setTabs(next);
        if (activeId === id) setActiveId(next[next.length - 1].id);
    };

    return (
        <TabContext.Provider
            value={{
                tabs,
                activeId,
                path,
                setActiveId,
                navigate,
                back,
                forward,
                addTab,
                closeTab,
            }}
        >
            {children}
        </TabContext.Provider>
    );
}
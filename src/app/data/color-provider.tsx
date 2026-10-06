// color-provider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getStore } from "../utils/settings-store";
import { listen } from "@tauri-apps/api/event";

type ColorContext = {
    accent: string;
    setAccent: (color: string) => void;
};

const Ctx = createContext<ColorContext | null>(null);

export const useColor = () => {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useColor must be used inside ColorProvider");
    return ctx;
};

const DEFAULT_ACCENT = "#8b5cf6";

export function ColorProvider({ children }: { children: ReactNode }) {
    const [accent, setAccentState] = useState(DEFAULT_ACCENT);

    useEffect(() => {
        getStore().then(async (store) => {
            const saved = await store.get<string>("accent");
            if (saved) setAccentState(saved);
        });

        // picks up changes made from the settings window
        const unlisten = listen<{ accent: string }>("accent-changed", (event) => {
            setAccentState(event.payload.accent);
        });
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty("--color-accent", accent);
    }, [accent]);

    const setAccent = (color: string) => {
        setAccentState(color);
        getStore().then(async (store) => {
            await store.set("accent", color);
            await store.save();
        });
        // notify other windows (e.g. this one, if settings is open elsewhere)
        import("@tauri-apps/api/event").then(({ emit }) => emit("accent-changed", { accent: color }));
    };

    return <Ctx.Provider value={{ accent, setAccent }}>{children}</Ctx.Provider>;
}
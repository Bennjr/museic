import { useState } from "react";

import { SectionHeading } from "./components/section-heading";

type ShortcutMap = Record<string, string>;
const STORAGE_KEY = "shortcuts";
const DEFAULT_SHORTCUTS: ShortcutMap = {
    playPause: "MediaPlayPause",
    next: "MediaTrackNext",
    prev: "MediaTrackPrevious",
};

function loadShortcuts(): ShortcutMap {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) } : DEFAULT_SHORTCUTS;
    } catch {
        return DEFAULT_SHORTCUTS;
    }
}

export function ShortcutsSettings() {
    const [shortcuts, setShortcuts] = useState<ShortcutMap>(loadShortcuts);
    const [recording, setRecording] = useState<string | null>(null);

    const updateShortcut = (action: string, value: string) => {
        setShortcuts((prev) => {
            const next = { ...prev, [action]: value };
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const resetShortcuts = () => {
        localStorage.removeItem(STORAGE_KEY);
        setShortcuts(DEFAULT_SHORTCUTS);
    };

    const onKeyDown = (e: React.KeyboardEvent, action: string) => {
        e.preventDefault();
        if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return;
        const parts = [
            e.ctrlKey && "Control",
            e.altKey && "Alt",
            e.shiftKey && "Shift",
            e.metaKey && "Super",
            e.code,
        ].filter(Boolean) as string[];
        updateShortcut(action, parts.join("+"));
        setRecording(null);
    };

    return (
        <div>
            <SectionHeading title="Shortcuts" description="Keyboard shortcuts" />
            <div className="flex flex-col gap-2">
                {Object.entries(shortcuts).map(([action, combo]) => (
                    <div key={action} className="flex items-center justify-between bg-foreground p-2">
                        <span>{action}</span>
                        <button
                            onClick={() => setRecording(action)}
                            onKeyDown={(e) => recording === action && onKeyDown(e, action)}
                            onBlur={() => setRecording(null)}
                            className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20"
                        >
                            {recording === action ? "Press keys..." : combo}
                        </button>
                    </div>
                ))}
                <button onClick={resetShortcuts}>Reset to defaults</button>
            </div>
        </div>
    );
}
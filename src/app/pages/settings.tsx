import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Music, Palette, User, Info, Keyboard, Search } from "lucide-react";
import Decoration from "../../components/decoration";

import { AboutSettings } from "@components/setting-items/about";
import { AppearanceSettings } from "@components/setting-items/appearence";
import { MusicSettings } from "@components/setting-items/music";
import { ShortcutsSettings } from "@components/setting-items/shortcuts-settings";
import { StatisticsSettings } from "@components/setting-items/statistics";


type Section = "music" | "appearance" | "statistics" | "shortcuts" | "about";

const sections: { id: Section; label: string; icon: typeof Music }[] = [
    { id: "music", label: "Music", icon: Music },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "statistics", label: "Statistics", icon: User },
    { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    { id: "about", label: "About", icon: Info },
];

const sectionIds = sections.map((s) => s.id);
const isSection = (v: string | null): v is Section => sectionIds.includes(v as Section);

function getInitialSection(): Section {
    const fromQuery = new URLSearchParams(window.location.search).get("section");
    return isSection(fromQuery) ? fromQuery : "music";
}

export default function Settings() {
    const [section, setSection] = useState<Section>(getInitialSection);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const unlisten = listen<{ section: string }>("navigate-settings", (event) => {
            if (isSection(event.payload.section)) setSection(event.payload.section);
        });
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    return (
        <div className="w-screen h-screen gradient-default scroll-none overscroll-none overflow-hidden flex flex-col">
            <Decoration />

            <div className="flex flex-row flex-1 gap-6 overflow-hidden">
                <nav className="w-48 shrink-0 border-r border-foreground pr-6 p-4">
                    <h1 className="text-xl font-bold mb-4">Settings</h1>
                    <ul className="flex flex-col gap-1">
                        <div className="relative w-full mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-c-text/50 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/10 text-sm placeholder:text-c-text/40 outline-none focus:bg-white/15 transition-colors"
                            />
                        </div>
                        {sections.map(({ id, label, icon: Icon }) => (
                            <li key={id}>
                                <button
                                    onClick={() => setSection(id)}
                                    className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${section === id
                                        ? "bg-accent text-white"
                                        : "text-c-text/70 hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex-1 overflow-y-auto p-8">
                    {section === "music" && <MusicSettings />}
                    {section === "appearance" && <AppearanceSettings />}
                    {section === "statistics" && <StatisticsSettings />}
                    {section === "shortcuts" && <ShortcutsSettings />}
                    {section === "about" && <AboutSettings />}
                </div>
            </div>
        </div>
    );
}
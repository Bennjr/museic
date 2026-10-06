import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Music, Palette, User, Info, Keyboard, Search } from "lucide-react";
import Decoration from "../../components/decoration";

import { SettingsGroup } from "@components/settings-items/group";
import { SettingsRow } from "@components/settings-items/row";
import { Toggle } from "@components/settings-items/toggle";
import { CustomColorSwatch } from "@components/settings-items/custom-items";

import { useColor } from "../data/color-provider";

type Section = "music" | "appearance" | "account" | "shortcuts" | "about";

const sections: { id: Section; label: string; icon: typeof Music }[] = [
    { id: "music", label: "Music", icon: Music },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "account", label: "Account", icon: User },
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
                    {section === "account" && <AccountSettings />}
                    {section === "shortcuts" && <ShortcutsSettings />}
                    {section === "about" && <AboutSettings />}
                </div>
            </div>
        </div>
    );
}


function SectionHeading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-6">
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-sm text-c-text/50 mt-1">{description}</p>}
        </div>
    );
}

function MusicSettings() {
    return (
        <div>
            <SectionHeading title="Music" description="Library and playback behavior" />
            {/* song storage location, library folders, default volume, etc. */}
        </div>
    );
}

function AppearanceSettings() {
    const { accent, setAccent } = useColor();

    const [theme, setTheme] = useState<"dark" | "light" | "system">(
        () => (localStorage.getItem("settings.theme") as any) || "dark"
    );
    const [compact, setCompact] = useState(
        () => localStorage.getItem("settings.compact") === "true"
    );

    const updateTheme = (value: typeof theme) => {
        setTheme(value);
        localStorage.setItem("settings.theme", value);
    };

    const toggleCompact = () => {
        const next = !compact;
        setCompact(next);
        localStorage.setItem("settings.compact", String(next));
    };

    const accentOptions = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

    return (
        <div className="max-w-lg flex flex-col gap-8">
            <SectionHeading title="Appearance" description="Theme and display preferences" />

            <SettingsGroup title="Theme">
                <div className="flex gap-2">
                    {(["dark", "light", "system"] as const).map((option) => (
                        <button
                            key={option}
                            onClick={() => updateTheme(option)}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${theme === option
                                ? "bg-accent text-white"
                                : "bg-white/5 text-c-text/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </SettingsGroup>

            <SettingsGroup title="Accent color">
                <div className="flex gap-2">
                    {accentOptions.map((color) => (
                        <button
                            key={color}
                            onClick={() => setAccent(color)}
                            aria-label={color}
                            style={{ backgroundColor: color }}
                            className={`size-8 rounded-full transition-transform hover:scale-110 ${accent === color ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                                }`}
                        />
                    ))}
                    <CustomColorSwatch value={accent} onChange={setAccent} />
                </div>
            </SettingsGroup>

            <SettingsGroup title="Layout">
                <SettingsRow label="Compact mode" description="Reduce spacing in lists and sidebars">
                    <Toggle checked={compact} onChange={toggleCompact} />
                </SettingsRow>
            </SettingsGroup>
        </div>
    );
}

function AccountSettings() {
    return (
        <div>
            <SectionHeading title="Account" />
        </div>
    );
}

function ShortcutsSettings() {
    return (
        <div>
            <SectionHeading title="Shortcuts" description="Keyboard shortcuts" />
        </div>
    );
}

function AboutSettings() {
    return (
        <div>
            <SectionHeading title="About" />
        </div>
    );
}
import { useState } from "react";
import { useColor } from "@/app/data/color-provider";

import { SectionHeading } from "./components/section-heading";
import { SettingsGroup } from "@/components/setting-items/components/group";
import { SettingsRow } from "@/components/setting-items/components/row";
import { Toggle } from "@/components/setting-items/components/toggle";
import { CustomColorSwatch } from "@/components/setting-items/components/custom-items";

export function AppearanceSettings() {
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


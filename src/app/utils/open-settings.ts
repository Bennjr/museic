import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openSettings(section?: string) {
    const url = section ? `/settings?section=${section}` : "/settings";

    const existing = await WebviewWindow.getByLabel("settings");
    if (existing) {
        try {
            await existing.setFocus();
            if (section) {
                await existing.emit("navigate-settings", { section });
            }
        } catch (e) {
            console.error("failed to focus settings window", e);
        }
        return;
    }

    const settings = new WebviewWindow("settings", {
        url,
        title: "Settings",
        width: 1000,
        height: 750,
        center: true,
        decorations: false,
        transparent: true,
        focus: true,
    });

    settings.once("tauri://created", () => {
        console.log("settings window created");
    });

    settings.once("tauri://error", (e) => {
        console.error("failed to create settings window", e);
    });
}
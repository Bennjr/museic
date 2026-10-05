import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export async function openSettings() {
    const existing = await WebviewWindow.getByLabel("settings");
    if (existing) {
        await existing.setFocus();
        return;
    }

    const settings = new WebviewWindow("settings", {
        url: "/settings",
        title: "Settings",
        width: 800,
        height: 600,
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
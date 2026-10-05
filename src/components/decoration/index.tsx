import { X, Minus, Square, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";


const appWindow = getCurrentWindow();

export default function Decoration() {
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const sync = () => appWindow.isMaximized().then(setIsMaximized);
        sync();

        const unlisten = appWindow.onResized(sync);
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    const buttonClass =
        "h-full px-3 flex items-center justify-center hover:bg-gray-500 transition-default";

    return (
        <div data-tauri-drag-region className="w-full h-8 bg-extra flex flex-row items-center">
            <div data-tauri-drag-region className="flex-1 h-full" />

            <button className={buttonClass} onClick={() => appWindow.minimize()}>
                <Minus size={16} />
            </button>
            <button className={buttonClass} onClick={() => appWindow.toggleMaximize()}>
                {isMaximized ? <Copy size={14} /> : <Square size={14} />}
            </button>
            <button
                className="h-full px-3 flex items-center justify-center hover:bg-red-600 transition-default"
                onClick={() => appWindow.close()}
            >
                <X size={16} />
            </button>
        </div>
    );
}
import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function PlayBar() {
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const isDragging = useRef(false);

    useEffect(() => {
        const interval = setInterval(async () => {
            if (isDragging.current) return;

            try {
                const progress = await invoke<{
                    position_secs: number;
                    duration_secs: number | null;
                }>("get_progress");

                setPosition(progress.position_secs);
                if (progress.duration_secs !== null) {
                    setDuration(progress.duration_secs);
                }
            } catch (e) {
                console.error("failed to get progress:", e);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const percent = duration > 0 ? (position / duration) * 100 : 0;

    const handleChange = (value: number) => {
        isDragging.current = true;
        const newPosition = (value / 100) * duration;
        setPosition(newPosition);
    };

    const handleCommit = (value: number) => {
        const newPosition = (value / 100) * duration;
        invoke("seek_song", { positionSecs: newPosition }).catch(console.error);
        isDragging.current = false;
    };

    return (
        <div className="w-full flex flex-row gap-4 items-center">
            <p>{formatTime(position)}</p>
            <input
                type="range"
                min={0}
                max={100}
                value={percent}
                onChange={(e) => handleChange(Number(e.target.value))}
                onMouseUp={(e) => handleCommit(Number((e.target as HTMLInputElement).value))}
                onTouchEnd={(e) => handleCommit(Number((e.target as HTMLInputElement).value))}
                className="w-full h-1 bg-white rounded-full"
            />
            <p>{formatTime(duration)}</p>
        </div>
    );
}
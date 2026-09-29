import { useState, useRef } from "react";

function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayBar({ position, duration, onSeek }: {
    position: number;
    duration: number;
    onSeek: (secs: number) => void;
}) {
    const [dragValue, setDragValue] = useState<number | null>(null);
    const dragRef = useRef<number | null>(null);
    const shown = dragValue ?? position;
    const fill = duration > 0 ? (shown / duration) * 100 : 0;

    const handleChange = (v: number) => {
        dragRef.current = v;
        setDragValue(v);
    };

    const commit = () => {
        const v = dragRef.current;
        if (v === null) return; // already committed, ignore duplicate events
        dragRef.current = null;
        setDragValue(null);
        onSeek(v);
    };

    return (
        <div className="flex-1 flex flex-row items-center gap-3 text-xs text-gray-400 tabular-nums">
            <span className="w-10 text-right">{formatTime(shown)}</span>
            <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={shown}
                disabled={duration === 0}
                onChange={(e) => handleChange(Number(e.target.value))}
                onPointerUp={commit}
                onPointerCancel={commit}
                onKeyUp={commit}
                style={{ "--fill": `${fill}%` } as React.CSSProperties}
                className="slider flex-1"
            />
            <span className="w-10">{formatTime(duration)}</span>
        </div>
    );
}
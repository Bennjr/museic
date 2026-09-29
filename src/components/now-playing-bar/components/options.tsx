import { Repeat, Repeat1, Shuffle, Volume2, VolumeOff } from "lucide-react";
import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type RepeatMode = "off" | "all" | "one";
const nextRepeat: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

const toggleBtn = (active: boolean) =>
    `p-2 rounded-full hover:bg-accent transition-default ${active ? "text-white" : "text-gray-500"}`;

export default function Options() {
    const [repeat, setRepeat] = useState<RepeatMode>("off");
    const [shuffle, setShuffle] = useState(false);
    const [volume, setVolume] = useState(60);

    return (
        <div className="flex flex-row gap-1 items-center">
            <button
                className={toggleBtn(repeat !== "off")}
                onClick={() => setRepeat((r) => nextRepeat[r])}
                aria-label={`Repeat: ${repeat}`}
            >
                {repeat === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
            <button
                className={toggleBtn(shuffle)}
                onClick={() => setShuffle((s) => !s)}
                aria-label="Shuffle"
            >
                <Shuffle size={18} />
            </button>
            <Volume volume={volume} setVolume={setVolume} />
        </div>
    );
}

function Volume({ volume, setVolume }: { volume: number; setVolume: (v: number) => void }) {
    const previous = useRef(volume > 0 ? volume : 50);
    const lastSent = useRef(0);

    const send = (v: number, force = false) => {
        const now = Date.now();
        if (!force && now - lastSent.current < 50) return;
        lastSent.current = now;
        invoke("set_volume", { volume: (v / 100) ** 2 }).catch(console.error);
    };

    const change = (v: number) => {
        if (v > 0) previous.current = v;
        setVolume(v);
        send(v);
    };

    const toggleMute = () => {
        const next = volume === 0 ? previous.current : 0;
        if (volume !== 0) previous.current = volume;
        setVolume(next);
        send(next, true);
    };

    return (
        <div className="flex flex-row items-center gap-2 ml-2">
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-accent transition-default" aria-label="Mute">
                {volume === 0 ? <VolumeOff size={18} /> : <Volume2 size={18} />}
            </button>
            <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => change(Number(e.target.value))}
                onPointerUp={() => send(volume, true)} // make sure the final value lands
                style={{ "--fill": `${volume}%` } as React.CSSProperties}
                className="slider w-24"
            />
        </div>
    );
}
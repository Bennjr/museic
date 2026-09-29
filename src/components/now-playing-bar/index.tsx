import { useState } from "react";
import { ChevronUp, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import Options from "./components/options";
import PlayBar from "./components/play-bar";
import NowPlayingExpanded from "./components/now-playing-expanded";
import { usePlayer } from "./use-player";

const iconBtn = "p-2 rounded-full hover:bg-accent transition-default";

export default function NowPlayingBar() {
    const [expanded, setExpanded] = useState(false);
    const player = usePlayer();

    const togglePlay = async () => {
        await invoke(player.playing ? "pause_song" : "resume_song");
        player.refresh();
    };

    const seek = (secs: number) =>
        invoke("seek_song", { positionSecs: secs }).then(player.refresh).catch(console.error);

    return (
        <aside
            className={`fixed left-0 right-0 bg-extra flex flex-col overflow-hidden z-50
                transition-all duration-300 ease-in-out
                ${expanded ? "top-0 bottom-0 rounded-none" : "bottom-0 h-14 rounded-b-sm"}`}
        >
            {expanded ? (
                <NowPlayingExpanded player={player} onCollapse={() => setExpanded(false)} onTogglePlay={togglePlay} onSeek={seek} />
            ) : (
                <div className="h-14 flex flex-row items-center gap-6 px-4 shrink-0">
                    <div className="flex flex-row items-center gap-1 shrink-0">
                        <button className={iconBtn} aria-label="Previous">
                            <SkipBack size={20} />
                        </button>
                        <button
                            onClick={togglePlay}
                            aria-label={player.playing ? "Pause" : "Play"}
                            className="p-2 rounded-full bg-white text-black hover:scale-105 transition-transform"
                        >
                            {player.playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        <button className={iconBtn} aria-label="Next">
                            <SkipForward size={20} />
                        </button>
                    </div>

                    <PlayBar position={player.position} duration={player.duration} onSeek={seek} />

                    <div className="flex flex-row items-center gap-2 shrink-0">
                        <Options />
                        <button className={iconBtn} aria-label="Expand" onClick={() => setExpanded(true)}>
                            <ChevronUp size={18} />
                        </button>
                    </div>
                </div>
            )}
        </aside>
    );
}
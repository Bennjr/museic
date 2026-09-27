import { Play, Pause, Repeat, SkipForward } from "lucide-react";
import { useState } from "react";
import { invoke } from '@tauri-apps/api/core';

import Options from "./components/options";
import PlayBar from "./components/play-bar";
import SongInfo from "./components/song-info";

export default function NowPlayingBar() {
    const [isPlaying, setPlaying] = useState(false);

    const togglePlay = async () => {
        if (isPlaying) {
            await invoke("pause_song")
            setPlaying(false)
        } else {
            await invoke("resume_song")
            setPlaying(true)
        }
    }

    return (
        <aside className="w-full h-full flex flex-col">
            <SongInfo />
            <div className="bg-black grid grid-cols-2 h-full items-center px-4 h-24 rounded-b-lg p-2">
                <div className="flex flex-row items-center gap-4">
                    <div className="flex flex-row items-center gap-1">
                        <button className="p-2 hover:bg-gray-500 rounded-full transition-default">
                            <SkipForward className="rotate-180" />
                        </button>
                        <button
                            onClick={() => togglePlay()}
                            className="p-2 hover:bg-gray-500 rounded-full transition-default"
                        >
                            {isPlaying ? <Pause /> : <Play />}
                        </button>
                        <button className="p-2 hover:bg-gray-500 rounded-full transition-default">
                            <SkipForward />
                        </button>
                    </div>
                    <PlayBar />
                </div>
                <div className="flex flex-row gap-2 justify-end items-center">
                    <Options />
                </div>
            </div>
        </aside>
    );
}
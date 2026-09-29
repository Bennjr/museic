import { ChevronDown, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import PlayBar from "./play-bar";

type Props = {
    player: { position: number; duration: number; playing: boolean };
    onCollapse: () => void;
    onTogglePlay: () => void;
    onSeek: (secs: number) => void;
};

export default function NowPlayingExpanded({ player, onCollapse, onTogglePlay, onSeek }: Props) {
    return (
        <div className="h-full w-full flex flex-col text-white">
            <div className="flex justify-center p-4">
                <button onClick={onCollapse} className="p-2 rounded-full hover:bg-accent transition-default" aria-label="Collapse">
                    <ChevronDown size={22} />
                </button>
            </div>

            <div className="flex-1 flex flex-row items-center justify-center gap-8">
                <div className="w-72 h-72 bg-black/20 rounded-lg" />

                <div className="flex flex-col gap-6">
                    <div className="text-left">
                        <p className="text-xl font-semibold">Song title</p>
                        <p className="text-gray-400">Artist name</p>
                    </div>

                    <div className="flex flex-row items-center gap-6">
                        <SkipBack size={24} className="cursor-pointer" />
                        <button onClick={onTogglePlay} className="p-4 rounded-full bg-white text-black hover:scale-105 transition-transform">
                            {player.playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        <SkipForward size={24} className="cursor-pointer" />
                    </div>

                    <div className="w-full px-8">
                        <PlayBar position={player.position} duration={player.duration} onSeek={onSeek} />
                    </div>
                </div>
            </div>
        </div>
    );
}
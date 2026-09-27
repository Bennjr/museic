import { Repeat, Volume2, Repeat1, VolumeOff, Shuffle } from "lucide-react";
import { useRef, useState } from "react"

type RepeatMode = "off" | "all" | "one";

export default function Options() {
    const [repeat, setRepeat] = useState<RepeatMode>("off");
    const [shuffle, setShuffle] = useState(false);
    const [volume, setVolume] = useState(60);

    const toggleShuffle = () => {
        setShuffle(prev => !prev)
    }
    const toggleRepeat = () => {
        setRepeat("all")
    }

    return (
        <div className="flex flex-row gap-4 items-center">
            <Repeat className={repeat ?
                ("text-gray-500 cursor-pointer") : ("text-white cursor-pointer")
            }
                onClick={toggleRepeat}
            />
            <Shuffle className={shuffle ?
                ("text-gray-500 cursor-pointer") : ("text-white cursor-pointer")
            }
                onClick={toggleShuffle}
            />
            <Volume volume={volume} setVolume={setVolume} />
        </div>
    );
}

const Volume = ({ volume, setVolume }: {
    volume: number;
    setVolume: (value: number) => void
}) => {
    const previousVolume = useRef(volume > 0 ? volume : 50);

    const toggleMute = () => {
        if (volume === 0) {
            setVolume(previousVolume.current);
        } else {
            previousVolume.current = volume;
            setVolume(0);
        }
    };

    return (
        <div className="flex flex-row gap-2 justify-center items-center">
            {volume === 0 ? (
                <VolumeOff onClick={toggleMute} className="cursor-pointer" />
            ) : (
                <Volume2 onClick={toggleMute} className="cursor-pointer" />
            )}
            <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-1 bg-white rounded-full"
            />
        </div>
    );
};
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Repeat, Repeat1, Shuffle, Volume2, VolumeOff } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

import { Song } from "../../../app/utils/use-player"

type RepeatMode = "off" | "all" | "one";
const nextRepeat: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

const toggleBtn = (active: boolean) =>
    `p-2 rounded-full hover:bg-accent transition-default ${active ? "text-white" : "text-gray-500"}`;

export default function Options({ currentSong }: { currentSong: Song | null }) {
    const [repeat, setRepeat] = useState<RepeatMode>("off");
    const [shuffle, setShuffle] = useState(false);
    const [volume, setVolume] = useState(60);
    const [popup, setPopup] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const openPopup = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top - 8, // a bit above the button
                left: rect.right,  // right-align to the button
            });
        }
        setPopup((p) => !p);
    };

    useEffect(() => {
        if (!popup) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current && !popupRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setPopup(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [popup]);

    return (
        <div className="flex flex-row gap-1 items-center">
            <button
                ref={buttonRef}
                onClick={openPopup}
                aria-label="Add to playlist"
                className={`p-2 rounded-full border border-foreground hover:bg-accent transition-colors ${popup ? "bg-accent" : ""
                    }`}
            >
                <Plus className="size-6" />
            </button>

            {popup && createPortal(
                <div
                    ref={popupRef}
                    style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translate(-100%, -100%)" }}
                    className="z-[100]"
                >
                    <PopupAdd song={currentSong} />
                </div>,
                document.body
            )}

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

type Playlist = { id: number; name: string; description: string; created: string };

function PopupAdd({ song }: { song: Song | null }) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            setPlaylists(await invoke<Playlist[]>("get_playlists"));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const addToPlaylist = async (playlistId: number) => {
        console.log("song at click time:", song);
        if (!song) return;
        try {
            await invoke("add_to_playlist", { playlistId, songId: song.id });
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadPlaylists();
    }, []);

    return (
        <div className="flex flex-col p-2 bg-foreground rounded-lg min-w-48 shadow-xl border border-white/10">
            {loading ? (
                <p className="text-xs text-c-text/40 px-2 py-1">Loading...</p>
            ) : playlists.length === 0 ? (
                <p className="text-xs text-c-text/40 px-2 py-1">No playlists yet</p>
            ) : (
                <ul className="flex flex-col">
                    {playlists.map((playlist) => (
                        <li key={playlist.id}>
                            <button
                                onClick={() => addToPlaylist(playlist.id)}
                                className="group flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-white/10 transition-colors"
                            >
                                <Plus className="size-3.5 shrink-0 opacity-0 -ml-5 group-hover:ml-0 group-hover:opacity-100 transition-all duration-150" />
                                <span className="truncate">{playlist.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
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
                onPointerUp={() => send(volume, true)}
                style={{ "--fill": `${volume}%` } as React.CSSProperties}
                className="slider w-24"
            />
        </div>
    );
}
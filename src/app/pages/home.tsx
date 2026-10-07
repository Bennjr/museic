import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { usePlayer } from "../utils/use-player";

type Song = { id: number; name: string; description: string; author: string; added: string; length: string };

function useSongs(command: string) {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        invoke<Song[]>(command)
            .then(setSongs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [command]);

    return { songs, loading };
}

export default function Home() {
    const recent = useSongs("get_recent_songs");
    const quickPicks = useSongs("get_quick_picks");
    const recentlyPlayed = useSongs("get_recently_played");
    const neverPlayed = useSongs("get_never_played");

    const player = usePlayer();

    return (
        <div className="w-full h-full gradient-default scroll-smooth overflow-y-auto">
            <div className="flex flex-col gap-16 p-8">

                <SongRow title="Most recent" songs={recent.songs} loading={recent.loading} onPlay={player.playSong} />

                <section>
                    <h2 className="mb-4 text-3xl font-bold">Quick picks</h2>
                    {quickPicks.songs.length === 0 && !quickPicks.loading ? (
                        <EmptyState text="Play a few songs to see picks here" />
                    ) : (
                        <div className="grid grid-cols-3 grid-rows-3 gap-4">
                            {quickPicks.songs.map((song) => (
                                <button
                                    key={song.id}
                                    onClick={() => player.playSong(song.id)}
                                    className="flex items-center gap-3 p-2 bg-foreground rounded-sm text-left hover:bg-white/10 transition-colors min-w-0 overflow-hidden"
                                >
                                    <div className="size-12 bg-blue-500 rounded-lg shrink-0" />
                                    <div className="min-w-0 flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{song.name}</p>
                                        <p className="text-sm text-c-text/70 truncate">{song.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h2 className="mb-4 text-3xl font-bold">Recently Played</h2>
                    {recentlyPlayed.songs.length === 0 && !recentlyPlayed.loading ? (
                        <EmptyState text="Nothing played yet" />
                    ) : (
                        <div className="w-full h-56">
                            {recentlyPlayed.songs.slice(0, 1).map((song) => (
                                <button
                                    key={song.id}
                                    onClick={() => player.playSong(song.id)}
                                    className="h-full w-full flex flex-row gap-3 p-2 bg-foreground rounded-sm text-left hover:bg-white/10 transition-colors"
                                >
                                    <div className="w-auto h-full aspect-square p-2 bg-blue-500 rounded-lg shrink-0" />
                                    <div>
                                        <p className="font-medium truncate">{song.name}</p>
                                        <p className="text-sm text-c-text/70 truncate">{song.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <SongRow title="Never listened" songs={neverPlayed.songs} loading={neverPlayed.loading} onPlay={player.playSong} />
            </div>
        </div>
    );
}

function SongRow({ title, songs, loading, onPlay }: {
    title: string;
    songs: Song[];
    loading: boolean;
    onPlay: (id: number) => void;
}) {
    return (
        <section>
            <h2 className="mb-4 text-3xl font-bold">{title}</h2>
            {songs.length === 0 && !loading ? (
                <EmptyState text="Nothing here yet" />
            ) : (
                <div className="flex flex-row gap-4 overflow-x-auto">
                    {songs.map((song) => (
                        <div
                            key={song.id}
                            className="flex flex-col gap-2 group cursor-pointer w-36 2xl:w-56 shrink-0"
                            onClick={() => onPlay(song.id)}
                        >
                            <div className="relative size-36 2xl:size-56 bg-foreground rounded-lg overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="size-12 rounded-full bg-black/90 flex items-center justify-center shadow-lg">
                                        <Play className="size-6 text-white fill-white ml-0.5" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm truncate w-full">{song.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

function EmptyState({ text }: { text: string }) {
    return <p className="text-sm opacity-40">{text}</p>;
}
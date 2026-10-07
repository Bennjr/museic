import { Play } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

interface Song {
    id: number;
    name: string;
    description: string | null;
    author: string;
    added: string;
    length: number;
    path: string;
}

type Sort = "all" | "recently_played" | "popular" | "never_played";

const tabs: { key: Sort; label: string }[] = [
    { key: "all", label: "All" },
    { key: "recently_played", label: "Recent" },
    { key: "popular", label: "Most played" },
    { key: "never_played", label: "Never played" },
];

const PAGE_SIZE = 20;

export default function Songs() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [sort, setSort] = useState<Sort>("all");
    const requestId = useRef(0);

    const fetchPage = async (sortBy: Sort, offset: number) => {
        const id = ++requestId.current;
        setLoading(true);
        try {
            const next = await invoke<Song[]>("get_songs_by_sort", {
                sortBy,
                offset,
                limit: PAGE_SIZE,
            });
            if (id !== requestId.current) return;
            setSongs((prev) => (offset === 0 ? next : [...prev, ...next]));
            setHasMore(next.length === PAGE_SIZE);
        } catch (e) {
            if (id === requestId.current) console.error(e);
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    };

    const updateSong = (songId: number, field: string, value: string) => {
        setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, [field]: value } : s)));
        invoke("update_song_field", { id: songId, field, value }).catch(console.error);
    };

    const playSong = (songId: number) => invoke("play_song_from_db", { id: songId }).catch(console.error);

    useEffect(() => {
        fetchPage(sort, 0);
    }, [sort]);

    const loadMore = () => {
        if (loading || !hasMore) return;
        fetchPage(sort, songs.length);
    };

    return (
        <div className="gradient-default w-screen h-screen">
            <div className="p-4">
                <div className="flex flex-row justify-between items-center gap-4 py-2">
                    <h1 className="text-2xl font-bold">Songs</h1>
                    <div className="w-full flex flex-row gap-2">
                        {tabs.map((t) => (
                            <button
                                key={t.key}
                                onClick={() => setSort(t.key)}
                                className={`w-32 p-2 rounded-md ${sort === t.key ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <ul className="flex flex-col">
                    {songs.map((song, i) => (
                        <li key={song.id} className="group grid grid-cols-[16px_1fr_1fr_120px_80px] gap-4 px-3 py-2 rounded-md hover:bg-white/5 transition-colors items-center">
                            <div className="text-sm opacity-50 tabular-nums relative">
                                <span className="group-hover:hidden">{i + 1}</span>
                                <button onClick={() => playSong(song.id)} className="hidden group-hover:block absolute left-0 top-1/2 -translate-y-1/2">
                                    <Play className="size-4 fill-current" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-10 rounded bg-white/10 shrink-0" />
                                <div className="min-w-0 flex flex-col gap-0.5">
                                    <input
                                        value={song.name}
                                        onChange={(e) => updateSong(song.id, "name", e.target.value)}
                                        className="bg-transparent font-medium truncate outline-none focus:bg-white/10 rounded px-1 -ml-1"
                                    />
                                    <input
                                        value={song.author}
                                        onChange={(e) => updateSong(song.id, "author", e.target.value)}
                                        className="bg-transparent text-sm opacity-50 truncate outline-none focus:bg-white/10 rounded px-1 -ml-1"
                                    />
                                </div>
                            </div>

                            <input
                                value={song.description}
                                onChange={(e) => updateSong(song.id, "description", e.target.value)}
                                className="bg-transparent text-sm opacity-60 truncate outline-none focus:bg-white/10 rounded px-1"
                            />

                            <input
                                value={song.added}
                                onChange={(e) => updateSong(song.id, "added", e.target.value)}
                                className="bg-transparent text-sm opacity-50 outline-none focus:bg-white/10 rounded px-1"
                            />

                            <div className="text-sm opacity-50 text-right tabular-nums">{song.length}</div>
                        </li>
                    ))}
                </ul>
                <div className="flex justify-center py-4">
                    {hasMore && (
                        <button onClick={loadMore} disabled={loading} className="btn-accent">
                            Load more
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
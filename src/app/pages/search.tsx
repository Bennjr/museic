import { useEffect, useState } from "react";
import { Search as SearchIcon, Play, ListMusic } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate, useSearchParams } from "react-router-dom";

type Song = { id: number; name: string; description: string; author: string; added: string; length: string };
type Playlist = { id: number; name: string; description: string; created: string };

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") ?? "";
    const [debouncedQuery, setDebouncedQuery] = useState(query);
    const [songs, setSongs] = useState<Song[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query), 250);
        return () => clearTimeout(id);
    }, [query]);

    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setSongs([]);
            setPlaylists([]);
            return;
        }
        setLoading(true);
        Promise.all([
            invoke<Song[]>("search_songs", { query: debouncedQuery }),
            invoke<Playlist[]>("search_playlists", { query: debouncedQuery }),
        ])
            .then(([s, p]) => {
                setSongs(s);
                setPlaylists(p);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [debouncedQuery]);

    const playSong = (id: number) => invoke("play_song_from_db", { id }).catch(console.error);

    const hasQuery = debouncedQuery.trim().length > 0;
    const hasResults = songs.length > 0 || playlists.length > 0;

    return (
        <div className="p-6 md:p-8 max-w-3xl mx-auto flex flex-col gap-8 h-full overflow-y-auto">
            {!hasQuery && <EmptyState text="Search your library" />}
            {hasQuery && loading && <EmptyState text="Searching..." />}
            {hasQuery && !loading && !hasResults && <EmptyState text={`No results for "${debouncedQuery}"`} />}

            {hasQuery && !loading && hasResults && (
                <div className="flex flex-col gap-10">
                    {songs.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-c-text/50">Songs</h2>
                            <ul className="flex flex-col">
                                {songs.map((song) => (
                                    <li key={song.id}>
                                        <button
                                            onClick={() => playSong(song.id)}
                                            className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div className="relative size-10 rounded bg-foreground shrink-0 flex items-center justify-center">
                                                <Play className="size-4 opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{song.name}</p>
                                                <p className="text-xs text-c-text/50 truncate">{song.author}</p>
                                            </div>
                                            <span className="text-xs text-c-text/40 tabular-nums shrink-0">{song.length}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {playlists.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-c-text/50">Playlists</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {playlists.map((playlist) => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-foreground hover:bg-white/10 transition-colors text-left"
                                    >
                                        <div className="size-10 rounded-md bg-blue-500 shrink-0 flex items-center justify-center">
                                            <ListMusic className="size-5 text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{playlist.name}</p>
                                            <p className="text-xs text-c-text/50 truncate">{playlist.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-c-text/40">
            <SearchIcon className="size-10 opacity-30" />
            <p className="text-sm">{text}</p>
        </div>
    );
}
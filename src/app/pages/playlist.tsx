import { Clock, Play, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useParams } from "react-router-dom";

type Song = { id: number; name: string; description: string; author: string; added: string; length: string };
type PlaylistMeta = { id: number; name: string; description: string; created: string };

export default function Playlist() {
    const { id } = useParams();
    const playlistId = Number(id);

    const [playlist, setPlaylist] = useState<PlaylistMeta | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);

    const [deleted, setDeleted] = useState(false)

    useEffect(() => {
        invoke<[PlaylistMeta, Song[]]>("get_playlist_with_songs", { id: playlistId })
            .then(([meta, s]) => { setPlaylist(meta); setSongs(s); })
            .catch(console.error);
    }, [playlistId]);

    const delete_playlist = async () => {
        invoke("delete_playlist", { id: playlistId })
        setDeleted(true)
    }

    const updateSong = (songId: number, field: string, value: string) => {
        setSongs((prev) => prev.map((s) => (s.id === songId ? { ...s, [field]: value } : s)));
        invoke("update_song_field", { id: songId, field, value }).catch(console.error);
    };

    const playSong = (songId: number) => invoke("play_song_from_db", { id: songId }).catch(console.error);

    if (!playlist) return null;

    return (
        <div className="w-screen h-screen gradient-default">
            <div className="relative h-full w-full p-6 md:p-8 flex flex-col gap-8">
                {deleted ? (<PlaylistDeleted />) : ("")}
                <div className="flex items-end gap-6">
                    <div className="size-40 md:size-52 rounded-lg bg-foreground shadow-xl shrink-0" />
                    <div className="flex flex-col gap-2 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Playlist</p>
                        <h1 className="text-4xl md:text-5xl font-bold truncate">{playlist.name}</h1>
                        <p className="text-sm opacity-70">{playlist.description}</p>
                        <p className="text-sm opacity-50 mt-1">{songs.length} songs</p>
                    </div>
                    <button className="p-2 hover:bg-white" onClick={delete_playlist}>
                        <Trash />
                    </button>
                </div>

                <div className="grid grid-cols-[16px_1fr_1fr_120px_80px] gap-4 px-3 text-xs font-medium uppercase tracking-wider opacity-50">
                    <span>#</span>
                    <span>Title</span>
                    <span>Album</span>
                    <span>Date added</span>
                    <span className="flex justify-end"><Clock className="size-4" /></span>
                </div>

                <div className="h-px bg-white/10 -mt-4" />

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
            </div>
        </div>
    );
}

const PlaylistDeleted = () => {
    return (
        <div className="justify-items-center justify-center fixed w-full h-full flex flex-col gap-4 bg-background z-50">
            <h1 className="text-4xl text-bold">Playlist successfully deleted</h1>
            <p>You can now return</p>
        </div>
    )
}

const PlaylistConfig = () => {
    return (
        <div>

        </div>
    )
}

const PlaylistHero1 = (playlist: PlaylistMeta, songs: Song, delete_playlist: any) => {
    return (
        <div className="flex items-end gap-6">
            <div className="size-40 md:size-52 rounded-lg bg-foreground shadow-xl shrink-0" />
            <div className="flex flex-col gap-2 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Playlist</p>
                <h1 className="text-4xl md:text-5xl font-bold truncate">{playlist.name}</h1>
                <p className="text-sm opacity-70">{playlist.description}</p>
                <p className="text-sm opacity-50 mt-1">{songs.length} songs</p>
            </div>
            <button className="p-2 hover:bg-white" onClick={delete_playlist}>
                <Trash />
            </button>
        </div>
    )
}
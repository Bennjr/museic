import { Play } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"

const temp_recent = [
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
]

const temp_quick_picks = [
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
    { "name": "Something", "description": "Some desc", "author": "Some author", "added": "Dec 28 2026", "length": "3:23" },
]

const temp_playlists = [
    { "name": "temp1", "url": "/playlist", "description": "desc1" },
    { "name": "temp2", "url": "/playlist", "description": "desc2" },
    { "name": "temp3", "url": "/playlist", "description": "desc3" },
    { "name": "temp4", "url": "/playlist", "description": "desc4" },
    { "name": "temp5", "url": "/playlist", "description": "desc5" }
]

export default function Home() {

    const playSong = async () => {
        await invoke("play_song_from_db", { id: 1 });
    }

    return (
        <div className="flex flex-col gap-16 p-8">
            <h1 className="text-4xl font-bold">Home</h1>

            <section>
                <h2 className="mb-4 text-3xl font-bold">Most recent</h2>
                <div className="flex flex-row gap-4">
                    {temp_recent.slice(0, 5).map((song) => (
                        <div key={song.name} className="flex flex-col gap-2 group cursor-pointer" onClick={playSong}>
                            <div className="relative 2xl:size-56 size-36 bg-blue-500 rounded-lg shrink-0 overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="size-12 rounded-full bg-black/90 flex items-center justify-center shadow-lg">
                                        <Play className="size-6 text-white fill-black ml-0.5" />
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm truncate">{song.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-3xl font-bold">Quick picks</h2>
                <div className="grid grid-cols-3 grid-rows-3 gap-4">
                    {temp_quick_picks.slice(0, 9).map((song) => (
                        <div key={song.name} className="flex items-center gap-3 p-2 bg-gray-900 rounded-sm">
                            <div className="size-12 bg-blue-500 rounded-lg shrink-0" />
                            <div className="min-w-0">
                                <p className="font-medium truncate">{song.name}</p>
                                <p className="text-sm text-c-text/70 truncate">{song.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <div className="w-full h-36 bg-blue-500 rounded-lg">
                    <h1>Temp banner</h1>
                </div>
            </section>

            <section>
                <h2 className="mb-4 text-3xl font-bold">Playlists</h2>
                <div className="flex flex-row gap-4 overflow-x-auto">
                    {temp_recent.map((song) => (
                        <div key={song.name} className="flex flex-col gap-2 shrink-0">
                            <div className="size-36 bg-blue-500 rounded-lg" />
                            <p className="text-sm truncate w-32">{song.name}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
import AddButton from "@components/add"

const temp = [
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

export default function Playlist() {
    return (
        <div className="relative p-8 flex flex-col gap-6">
            <div className="p-4 w-full bg-purple-500 flex flex-col gap-1 rounded-xl">
                <h1 className="font-bold text-2xl">Playlist</h1>
                <p className="text-sm opacity-80">Some desc</p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="w-full h-6 bg-red-500 rounded" />
                <ul className="flex flex-col gap-2">
                    {temp.map((song, i) => (
                        <li
                            key={i}
                            className="w-full h-16 bg-blue-500 grid grid-cols-4 rounded-lg px-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="size-12 bg-white rounded" />
                                <h2 className="font-medium">{song.name}</h2>
                            </div>
                            <div className="flex items-center text-sm opacity-80">
                                {song.description}
                            </div>
                            <div className="flex items-center text-sm opacity-80">
                                {song.added}
                            </div>
                            <div className="flex items-center text-sm opacity-80">
                                {song.length}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="fixed bottom-28 right-10 z-50">
                <AddButton />
            </div>
        </div>
    );
}
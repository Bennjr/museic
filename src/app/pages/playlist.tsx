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
        <div className="p-8 flex flex-col gap-6">
            <div className="p-2 w-full h-20 bg-purple-500 flex flex-col gap-2 rounded-md">
                <h1 className="font-bold text-2xl">Playlist</h1>
                <p>Some desc</p>
            </div>
            <div className="flex flex-col gap-2">
                <div className="w-full h-6 bg-red-500"></div>
                <ul className="flex flex-col gap-2">
                    {temp.map((song) => (
                        <li className="w-full h-16 bg-blue-500 grid grid-cols-4 rounded-sm">
                            <div className="flex flex-row items-center p-2 gap-2">
                                <div className="size-12 bg-white py-4" />
                                <h2>{song.name}</h2>
                            </div>
                            <div className="flex items-center">
                                {song.description}
                            </div>
                            <div className="flex items-center">
                                {song.added}
                            </div>
                            <div className="flex items-center">
                                {song.length}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
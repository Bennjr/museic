export default function NowPlayingBar() {
    return (
        <aside className="w-full h-16 bg-black rounded-lg">
            <div className="grid grid-cols-3">
                <div className="p-4 flex justify-start items-center">
                    <p>start</p>
                </div>
                <div className="flex p-4 flex flex-col gap-1">
                    <div className="text-center">
                        <p>Play</p>
                    </div>
                    <div className="w-full h-1 bg-white rounded-full" />
                </div>
                <div className="flex p-4 justify-end items-center">
                    <p>end</p>
                </div>
            </div>
        </aside>
    )
}
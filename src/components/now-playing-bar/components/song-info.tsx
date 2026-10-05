import { Song } from "../../../app/utils/use-player"

export function SongInfo({ song }: { song: Song | null }) {

    function truncate(str: string, max: number) {
        if (str.length <= max) return str;
        return str.slice(0, max).trimEnd() + "…";
    }


    if (!song) return <div className="text-sm opacity-40">Nothing playing</div>;

    return (
        <div className="flex flex-col min-w-0">
            <span className="font-medium truncate" title={song.name} >{truncate(song.name, 16)}</span>
            <span className="text-sm opacity-70 truncate">
                {song.author ?? "Unknown artist"}
            </span>
        </div>
    );
}
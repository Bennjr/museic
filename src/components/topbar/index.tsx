import { Cog, Search } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { openSettings } from "../../app/utils/open-settings"

export default function Topbar() {

    const [search, setSearch] = useState("");

    return (
        <div className="w-full h-16 bg-background border-b border-foreground flex items-center px-4 justify-between">
            <h1 className="text-xl font-bold">Museic</h1>
            <div className="relative w-[80%] max-w-[600px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-c-text/50 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/10 text-sm placeholder:text-c-text/40 outline-none focus:bg-white/15 transition-colors"
                />
            </div>
            <button onClick={openSettings}>
                <Cog className="size-10 text-c-text/50 rounded-full hover:text-white hover:rotate-90 hover:bg-white/10 p-2 duration-500" />
            </button>
        </div>
    )
}
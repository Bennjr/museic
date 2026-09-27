import { NavLink } from "react-router-dom";
import { Home, ListMusic, LibraryBig, Search } from "lucide-react";
import { useState } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

const temp_playlists = [
    { name: "Temp1", url: "/playlist", description: "desc1" },
    { name: "Temp2", url: "/playlist", description: "desc2" },
    { name: "Temp3", url: "/playlist", description: "desc3" },
    { name: "Temp4", url: "/playlist", description: "desc4" },
    { name: "Temp5", url: "/playlist", description: "desc5" },
];

export default function Sidebar() {
    const [search, setSearch] = useState("");
    const [width, setWidth] = useState(256); // default width

    return (
        <ResizableBox
            width={width}
            height={Infinity}
            axis="x"
            minConstraints={[200, Infinity]}
            maxConstraints={[420, Infinity]}
            onResize={(e, data) => setWidth(data.size.width)}
            resizeHandles={["e"]}
            handle={
                <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50
                 bg-transparent hover:bg-white/20 active:bg-white/30 transition-colors"
                />
            }
            className="relative h-full"
        >
            <aside
                style={{ width }}
                className="h-full flex flex-col bg-c-secondary/80 backdrop-blur-xl border-r border-white/5"
            >
                <div className="p-4 space-y-6 h-full flex flex-col">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-c-text/50 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/10 text-sm text-c-text placeholder:text-c-text/40 outline-none focus:bg-white/15 transition-colors"
                        />
                    </div>

                    {/* Main nav */}
                    <div className="flex flex-col gap-1">
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-c-text/70 hover:bg-white/5 hover:text-white"
                                }`
                            }
                        >
                            <Home className="size-5 shrink-0" />
                            <span className="font-medium">Home</span>
                        </NavLink>

                        <NavLink
                            to="/library"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                    ? "bg-white/10 text-white"
                                    : "text-c-text/70 hover:bg-white/5 hover:text-white"
                                }`
                            }
                        >
                            <LibraryBig className="size-5 shrink-0" />
                            <span className="font-medium">Library</span>
                        </NavLink>
                    </div>

                    {/* Playlists */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 px-3 mb-3">
                            <ListMusic className="size-4 text-c-text/50" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-c-text/50">
                                Playlists
                            </span>
                        </div>

                        <ul className="space-y-1">
                            {temp_playlists.map((list) => (
                                <li key={list.name}>
                                    <NavLink
                                        to={list.url}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${isActive
                                                ? "bg-white/10 text-white"
                                                : "text-c-text/70 hover:bg-white/5 hover:text-white"
                                            }`
                                        }
                                    >
                                        <div className="size-10 rounded-md bg-blue-500 shrink-0 shadow-sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{list.name}</p>
                                            <p className="text-xs text-c-text/50 truncate group-hover:text-c-text/70">
                                                {list.description}
                                            </p>
                                        </div>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Bottom */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="text-xs text-c-text/40 px-3">Your library</div>
                    </div>
                </div>
            </aside>
        </ResizableBox>
    );
}
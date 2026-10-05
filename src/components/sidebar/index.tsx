import { Home, ListMusic, LibraryBig, List, LayoutGrid, Rows3, Plus, Music } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate, useLocation, NavLink } from "react-router-dom";

type Playlist = { id: number; name: string; description: string; created: string };
type ViewMode = "list" | "compact" | "grid";

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left ${isActive ? "bg-white/10 text-white" : "text-c-text/70 hover:bg-white/5 hover:text-white"
                }`
            }
        >
            <Icon className="size-5 shrink-0" />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
}

export default function Sidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [width, setWidth] = useState(256);
    const [view, setView] = useState<ViewMode>("list");
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");

    const [isMaximized, setIsMaximized] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const loadPlaylists = () =>
        invoke<Playlist[]>("get_playlists").then(setPlaylists).catch(console.error);

    useEffect(() => {
        loadPlaylists();
    }, []);

    useEffect(() => {
        if (creating) inputRef.current?.focus();
    }, [creating]);

    const submitNewPlaylist = async () => {
        const name = newName.trim();
        if (!name) {
            setCreating(false);
            return;
        }
        try {
            const id = await invoke<number>("create_playlist", { name, description: "" });
            setNewName("");
            setCreating(false);
            await loadPlaylists();
            navigate(`/playlist/${id}`);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ResizableBox
            width={width}
            height={Infinity}
            axis="x"
            minConstraints={[200, Infinity]}
            maxConstraints={[420, Infinity]}
            onResize={(_, data) => setWidth(data.size.width)}
            resizeHandles={["e"]}
            handle={
                <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 bg-transparent hover:bg-white/20 active:bg-white/30 transition-colors" />
            }
            className="relative h-full z-20"
        >
            <aside style={{ width }} className="h-full flex flex-col bg-c-secondary/80 backdrop-blur-xl border-r border-white/5">
                <div className="p-4 space-y-6 h-full flex flex-col">
                    <div className="flex flex-col gap-1">
                        <NavItem to="/" icon={Home} label="Home" />
                        <NavItem to="/songs" icon={Music} label="Songs" />
                        <NavItem to="/library" icon={LibraryBig} label="Library" />
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col">
                        <div className="flex items-center justify-between px-3 mb-3">
                            <div className="flex items-center gap-2">
                                <ListMusic className="size-4 text-c-text/50" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-c-text/50">
                                    Playlists
                                </span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={() => setCreating(true)}
                                    className="p-1.5 rounded-md text-c-text/50 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="New playlist"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                                {(["list", "compact", "grid"] as ViewMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setView(mode)}
                                        className={`p-1.5 rounded-md transition-colors ${view === mode ? "bg-white/15 text-white" : "text-c-text/50 hover:text-white"
                                            }`}
                                    >
                                        {mode === "list" && <List className="size-3.5" />}
                                        {mode === "compact" && <Rows3 className="size-3.5" />}
                                        {mode === "grid" && <LayoutGrid className="size-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {creating && (
                            <input
                                ref={inputRef}
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") submitNewPlaylist();
                                    if (e.key === "Escape") {
                                        setCreating(false);
                                        setNewName("");
                                    }
                                }}
                                onBlur={submitNewPlaylist}
                                placeholder="Playlist name"
                                className="mx-3 mb-2 h-8 px-2 rounded-md bg-white/10 text-sm outline-none focus:bg-white/15"
                            />
                        )}

                        {playlists.length === 0 ? (
                            <p className="text-xs text-c-text/40 px-3">No playlists yet</p>
                        ) : view === "list" ? (
                            <ul className="space-y-1">
                                {playlists.map((list) => {
                                    const url = `/playlist/${list.id}`;
                                    const active = pathname === url;
                                    return (
                                        <li key={list.id}>
                                            <button
                                                onClick={() => navigate(url)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group w-full text-left ${active
                                                    ? "bg-white/10 text-white"
                                                    : "text-c-text/70 hover:bg-white/5 hover:text-white"
                                                    }`}
                                            >
                                                <div className="size-10 rounded-md bg-blue-500 shrink-0 shadow-sm" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{list.name}</p>
                                                    <p className="text-xs text-c-text/50 truncate">{list.description}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : null}
                    </div>
                </div>
            </aside>
        </ResizableBox>
    );
}
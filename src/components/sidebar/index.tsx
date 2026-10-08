import { Home, ListMusic, LibraryBig, List, LayoutGrid, Rows3, Plus, Music } from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";
import { usePlaylists, createPlaylist } from "../../app/utils/playlist";
import type { Playlist } from "../../app/utils/playlist";
import { useNavigate, useMatch, NavLink } from "react-router-dom";

type ViewMode = "list" | "compact" | "grid";

type PlaylistViewProps = {
    playlists: Playlist[];
    activeId: number | null;
    onSelect: (id: number) => void;
};

/* ---------- shared bits ---------- */

const itemState = (active: boolean) =>
    active
        ? "bg-white/10 text-white gradient-button"
        : "text-c-text/70 hover:bg-white/5 hover:text-white";

function PlaylistCover({ className = "" }: { className?: string }) {
    return <div className={`bg-blue-500 shrink-0 shadow-sm ${className}`} />;
}

/* ---------- view modes ---------- */

function PlaylistList({ playlists, activeId, onSelect }: PlaylistViewProps) {
    return (
        <ul className="space-y-1">
            {playlists.map((list) => (
                <li key={list.id}>
                    <button
                        onClick={() => onSelect(list.id)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group w-full text-left ${itemState(list.id === activeId)}`}
                    >
                        <PlaylistCover className="size-10 rounded-md" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{list.name}</p>
                            <p className="text-xs text-c-text/50 truncate">{list.description}</p>
                        </div>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function PlaylistCompact({ playlists, activeId, onSelect }: PlaylistViewProps) {
    return (
        <ul className="space-y-0.5">
            {playlists.map((list) => (
                <li key={list.id}>
                    <button
                        onClick={() => onSelect(list.id)}
                        title={list.name}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors w-full text-left ${itemState(list.id === activeId)}`}
                    >
                        <PlaylistCover className="size-5 rounded" />
                        <span className="text-sm truncate">{list.name}</span>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function PlaylistGrid({ playlists, activeId, onSelect }: PlaylistViewProps) {
    return (
        <ul className="grid grid-cols-2 gap-2 px-1">
            {playlists.map((list) => (
                <li key={list.id} className="min-w-0">
                    <button
                        onClick={() => onSelect(list.id)}
                        title={list.name}
                        className={`flex flex-col gap-1.5 p-2 rounded-lg transition-colors w-full text-left ${itemState(list.id === activeId)}`}
                    >
                        <PlaylistCover className="w-full aspect-square rounded-md" />
                        <p className="text-xs font-medium truncate">{list.name}</p>
                    </button>
                </li>
            ))}
        </ul>
    );
}

const VIEWS: Record<ViewMode, { component: ComponentType<PlaylistViewProps>; icon: typeof List; label: string }> = {
    list: { component: PlaylistList, icon: List, label: "List view" },
    compact: { component: PlaylistCompact, icon: Rows3, label: "Compact view" },
    grid: { component: PlaylistGrid, icon: LayoutGrid, label: "Grid view" },
};

/* ---------- sidebar ---------- */

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
                `nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left ${isActive ? "nav-item-active text-white" : "text-c-text/70 hover:text-white"
                }`
            }
        >
            <Icon className="size-5 shrink-0" />
            <span className="font-medium">{label}</span>
        </NavLink>
    );
}

function nextDefaultName(playlists: Playlist[]) {
    const base = "New playlist";
    const taken = new Set(playlists.map((p) => p.name));
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
}

export default function Sidebar() {
    const navigate = useNavigate();
    const match = useMatch("/playlist/:id");
    const activeId = match ? Number(match.params.id) : null;

    const [width, setWidth] = useState(256);
    const [view, setView] = useState<ViewMode>("list");
    const [creating, setCreating] = useState(false);

    const playlists = usePlaylists();

    const handleCreate = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const id = await createPlaylist(nextDefaultName(playlists));
            navigate(`/playlist/${id}`);
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const ActiveView = VIEWS[view].component;

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
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="p-1.5 rounded-md text-c-text/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                                    aria-label="New playlist"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                                {(Object.keys(VIEWS) as ViewMode[]).map((mode) => {
                                    const Icon = VIEWS[mode].icon;
                                    return (
                                        <button
                                            key={mode}
                                            onClick={() => setView(mode)}
                                            aria-label={VIEWS[mode].label}
                                            className={`p-1.5 rounded-md transition-colors ${view === mode ? "bg-white/15 text-white" : "text-c-text/50 hover:text-white"
                                                }`}
                                        >
                                            <Icon className="size-3.5" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {playlists.length === 0 ? (
                            <p className="text-xs text-c-text/40 px-3">No playlists yet</p>
                        ) : (
                            <ActiveView
                                playlists={playlists}
                                activeId={activeId}
                                onSelect={(id) => navigate(`/playlist/${id}`)}
                            />
                        )}
                    </div>
                </div>
            </aside>
        </ResizableBox>
    );
}
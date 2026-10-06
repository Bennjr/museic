import { Cog, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { openSettings } from "../../app/utils/open-settings";

export default function Topbar() {
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const previousPath = useRef<string>("/");

    const handleChange = (value: string) => {
        setSearch(value);
        const trimmed = value.trim();

        if (trimmed) {
            if (location.pathname !== "/search") {
                previousPath.current = location.pathname + location.search;
            }
            navigate(`/search?q=${encodeURIComponent(value)}`, {
                replace: location.pathname === "/search",
            });
        } else if (location.pathname === "/search") {
            navigate(previousPath.current);
        }
    };

    useEffect(() => {
        if (location.pathname !== "/search" && search) {
            setSearch("");
        }
    }, [location.pathname]);

    return (
        <div className="w-full h-16 bg-background border-b border-foreground flex items-center px-4 justify-between">
            <div className="flex flex-row items-end">
                <img src="/brand/logo-white-on-nothing.svg" alt="" className="size-8" />
                <h1 className="text-xl font-bold">Museic</h1>
            </div>
            <div className="relative w-[80%] max-w-[600px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-c-text/50 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/10 text-sm placeholder:text-c-text/40 outline-none focus:bg-white/15 transition-colors"
                />
            </div>
            <button onClick={openSettings}>
                <Cog className="size-10 text-c-text/50 rounded-full hover:text-white hover:rotate-90 hover:bg-white/10 p-2 duration-500" />
            </button>
        </div>
    );
}
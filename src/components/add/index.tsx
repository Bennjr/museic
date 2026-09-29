import { Plus } from "lucide-react";
import { useTab } from "@components/tab-provider";

export default function AddButton() {
    const { navigate, path } = useTab();
    const isActive = path === "/add";

    return (
        <button
            onClick={() => navigate("/add")}
            aria-label="Add music"
            className={`size-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isActive ? "bg-white text-black" : "bg-accent text-white hover:bg-white hover:text-black"
                }`}
        >
            <Plus className="size-5" />
        </button>
    );
}
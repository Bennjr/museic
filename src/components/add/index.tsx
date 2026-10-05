import { Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AddButton() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isActive = pathname === "/add";

    return (
        <button
            onClick={() => navigate("/add")}
            aria-label="Add music"
            className={`size-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${isActive
                ? "bg-white text-black"
                : "bg-accent text-white hover:bg-white hover:text-black"
                }`}
        >
            <Plus className="size-5" />
        </button>
    );
}
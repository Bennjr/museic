import { HexColorPicker } from "react-colorful";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CustomColorSwatch({ value, onChange }: { value: string; onChange: (color: string) => void }) {
    const [open, setOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Custom color"
                style={{ backgroundColor: value }}
                className="size-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ring-1 ring-white/20"
            >
                <Plus className="size-3.5 text-white mix-blend-difference" />
            </button>

            {open && (
                <div
                    ref={popoverRef}
                    className="absolute top-10 left-0 z-50 p-3 rounded-xl bg-c-secondary border border-white/10 shadow-xl"
                >
                    <HexColorPicker color={value} onChange={onChange} />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full mt-2 h-8 px-2 rounded-md bg-white/10 text-xs text-center outline-none focus:bg-white/15"
                    />
                </div>
            )}
        </div>
    );
}
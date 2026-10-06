export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            role="switch"
            aria-checked={checked}
            className={`w-10 h-6 rounded-full relative transition-colors ${checked ? "bg-accent" : "bg-white/10"}`}
        >
            <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4.5" : "translate-x-0.5"
                    }`}
            />
        </button>
    );
}
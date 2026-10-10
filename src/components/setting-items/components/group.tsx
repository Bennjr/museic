export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-c-text/50 mb-3">{title}</h2>
            {children}
        </div>
    );
}
export function SettingsRow({
    label,
    description,
    children,
}: {
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-1">
            <div>
                <p className="text-sm font-medium">{label}</p>
                {description && <p className="text-xs text-c-text/50 mt-0.5">{description}</p>}
            </div>
            {children}
        </div>
    );
}
export function SectionHeading({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mb-6">
            <h1 className="text-xl font-bold">{title}</h1>
            {description && <p className="text-sm text-c-text/50 mt-1">{description}</p>}
        </div>
    );
}
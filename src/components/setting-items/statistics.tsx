import { SectionHeading } from "./components/section-heading";

export function StatisticsSettings() {
    return (
        <div>
            <SectionHeading title="Statistics" />
            <ul className="flex flex-col gap-6">
                <li className="w-full h-56 bg-foreground">
                    <p>Most listened</p>
                </li>
                <li className="w-full h-56 bg-foreground">
                    <p>Hours listened</p>
                </li>
                <li className="w-full h-56 bg-foreground">
                    <p>Listening hours</p>
                </li>
            </ul>
        </div>
    );
}
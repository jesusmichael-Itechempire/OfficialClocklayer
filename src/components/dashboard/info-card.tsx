import type { ReactNode } from "react";

export function InfoCard({ icon, title, description }: { icon: ReactNode, title: string, description: string }) {
    return (
        <div className="w-full p-0.5 glowing-border rounded-2xl bg-transparent">
            <div className="w-full h-full rounded-2xl p-6 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10 neumorphism-outset-heavy">
                    {icon}
                </div>
                <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}

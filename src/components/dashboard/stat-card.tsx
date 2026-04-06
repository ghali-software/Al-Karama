import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accent = "bg-primary/10 text-primary",
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(13,124,95,0.15)] hover:border-primary/20">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground/80">
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

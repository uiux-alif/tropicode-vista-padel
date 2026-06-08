import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: string | number;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
      alert ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : "border-black/[0.06]"
    )}>
      <p className="text-xs font-medium uppercase tracking-wider text-ink/40">{label}</p>
      <p className={cn("mt-2 font-display text-3xl font-bold tracking-tightest", alert ? "text-amber-600" : "text-ink")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-black/[0.06] bg-white p-5 shadow-card", className)}>{children}</div>;
}

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export interface CourtCardData {
  id: string;
  name: string;
  type: string;
  surface: string;
  lighting: string;
  capacity: number;
  badge: string | null;
  features: string[];
  priceNormal?: number;
}

export function CourtCard({ court }: { court: CourtCardData }) {
  return (
    <div className="card card-hover group overflow-hidden">
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-light">
        <div className="absolute inset-0 bg-grid-faint [background-size:26px_26px] opacity-10" />
        <div className="absolute -bottom-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-brand-accent/20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
        <span className="relative font-display text-3xl font-bold tracking-tightest text-white/95">
          {court.name}
        </span>
        {court.badge && (
          <span className="absolute right-3 top-3">
            <Badge variant="accent">{court.badge}</Badge>
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-ink">{court.name}</h3>
          <Badge variant="outline">{court.type}</Badge>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink/60">
          <div><dt className="text-ink/40">Surface</dt><dd>{court.surface}</dd></div>
          <div><dt className="text-ink/40">Lighting</dt><dd>{court.lighting}</dd></div>
          <div><dt className="text-ink/40">Capacity</dt><dd>{court.capacity} Players</dd></div>
          {court.priceNormal ? (
            <div><dt className="text-ink/40">From</dt><dd className="font-semibold text-brand">{formatCurrency(court.priceNormal)}/hr</dd></div>
          ) : null}
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {court.features.slice(0, 4).map((f) => (
            <span key={f} className="badge bg-brand-mint text-brand">{f}</span>
          ))}
        </div>
        <Link
          href={`/schedule?court=${court.id}`}
          className="btn-outline mt-5 w-full"
        >
          Book Now →
        </Link>
      </div>
    </div>
  );
}

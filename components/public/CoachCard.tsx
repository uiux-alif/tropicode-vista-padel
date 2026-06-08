import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { simpleWaLink } from "@/lib/whatsapp";

export interface CoachCardData {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  certifications: string[];
  bio?: string | null;
  photoUrl?: string | null;
  programs: { id: string; name: string; duration: string; price: number; level: string }[];
}

export function CoachCard({ coach, whatsapp }: { coach: CoachCardData; whatsapp: string }) {
  const initials = coach.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="card card-hover overflow-hidden">
      <div className="flex items-center gap-4 border-b border-black/5 bg-gradient-to-br from-brand-mint/60 to-transparent p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand text-xl font-bold text-white shadow-soft">
          {coach.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coach.photoUrl} alt={coach.name} className="h-full w-full rounded-2xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-ink">{coach.name}</h3>
          <p className="text-sm text-brand">{coach.title}</p>
          <p className="text-xs text-ink/50">{coach.specialty} · {coach.experience}</p>
        </div>
      </div>

      <div className="p-5">
        {coach.bio && <p className="text-sm text-ink/60">{coach.bio}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {coach.certifications.map((c) => (
            <Badge key={c} variant="green">{c}</Badge>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-mint text-xs uppercase tracking-wide text-brand">
              <tr>
                <th className="px-3 py-2 font-semibold">Program</th>
                <th className="px-3 py-2 font-semibold">Duration</th>
                <th className="px-3 py-2 font-semibold">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {coach.programs.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-ink">{p.name}</div>
                    <div className="text-xs text-ink/40">{p.level}</div>
                  </td>
                  <td className="px-3 py-2 text-ink/60">{p.duration}</td>
                  <td className="px-3 py-2 font-semibold text-brand">{formatCurrency(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <a
          href={simpleWaLink(whatsapp, `Halo Vista Padel! Saya ingin booking sesi coaching dengan ${coach.name}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-5 w-full"
        >
          Book a Session →
        </a>
      </div>
    </div>
  );
}

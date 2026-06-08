"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";

interface CourtPrice { id: string; name: string; priceNormal: number; pricePeak: number }
interface GlobalPrice {
  peakHourStart: number;
  peakHourEnd: number;
  racketRental: number;
  ballRental: number;
  coachingAddon: number;
}

export default function PricingPage() {
  const [courts, setCourts] = useState<CourtPrice[]>([]);
  const [global, setGlobal] = useState<GlobalPrice | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/pricing", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setCourts(j.courts);
      setGlobal(j.global);
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courts, global }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Pricing"
        description="Court rates, peak hours, and add-on prices."
        action={<button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}</button>}
      />

      <Card className="mb-5">
        <h2 className="mb-3 font-semibold text-ink">Court rates (per hour)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase text-ink/40">
              <tr><th className="py-2">Court</th><th className="py-2">Standard</th><th className="py-2">Peak</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {courts.map((c, i) => (
                <tr key={c.id}>
                  <td className="py-2 font-medium text-ink">{c.name}</td>
                  <td className="py-2">
                    <input type="number" className="input max-w-[140px]" value={c.priceNormal}
                      onChange={(e) => setCourts(courts.map((x, j) => j === i ? { ...x, priceNormal: Number(e.target.value) } : x))} />
                  </td>
                  <td className="py-2">
                    <input type="number" className="input max-w-[140px]" value={c.pricePeak}
                      onChange={(e) => setCourts(courts.map((x, j) => j === i ? { ...x, pricePeak: Number(e.target.value) } : x))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {global && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink">Global settings</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Peak start (hour)"><input type="number" min={0} max={23} className="input" value={global.peakHourStart} onChange={(e) => setGlobal({ ...global, peakHourStart: Number(e.target.value) })} /></Field>
            <Field label="Peak end (hour)"><input type="number" min={0} max={23} className="input" value={global.peakHourEnd} onChange={(e) => setGlobal({ ...global, peakHourEnd: Number(e.target.value) })} /></Field>
            <div />
            <Field label="Racket rental"><input type="number" className="input" value={global.racketRental} onChange={(e) => setGlobal({ ...global, racketRental: Number(e.target.value) })} /></Field>
            <Field label="Ball rental"><input type="number" className="input" value={global.ballRental} onChange={(e) => setGlobal({ ...global, ballRental: Number(e.target.value) })} /></Field>
            <Field label="Coaching add-on"><input type="number" className="input" value={global.coachingAddon} onChange={(e) => setGlobal({ ...global, coachingAddon: Number(e.target.value) })} /></Field>
          </div>
        </Card>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

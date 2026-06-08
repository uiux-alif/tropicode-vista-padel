import { getAllContent, getContent } from "@/lib/content";
import { getGlobalPricing } from "@/lib/data";
import { ScheduleGrid } from "@/components/public/ScheduleGrid";
import { PageHero } from "@/components/public/PageHero";
import { upcomingDateKeys, formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // bookings change in real-time
export const metadata: Metadata = {
  title: "Schedule & Booking",
  description:
    "Check real-time court availability at Vista Padel Club and book your slot in seconds. Confirmed via WhatsApp.",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { court?: string };
}) {
  const [content, pricing] = await Promise.all([getAllContent(), getGlobalPricing()]);
  const dateKeys = upcomingDateKeys(7);

  let courtPrices: { name: string; normal: number; peak: number }[] = [];
  try {
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { pricing: true },
    });
    courtPrices = courts.map((c) => ({
      name: c.name,
      normal: c.pricing?.priceNormal ?? 0,
      peak: c.pricing?.pricePeak ?? 0,
    }));
  } catch {
    courtPrices = [];
  }

  const addons = {
    racketRental: pricing?.racketRental ?? 30000,
    ballRental: pricing?.ballRental ?? 15000,
    coachingAddon: pricing?.coachingAddon ?? 200000,
    peakStart: pricing?.peakHourStart ?? 17,
    peakEnd: pricing?.peakHourEnd ?? 22,
  };

  return (
    <>
      <PageHero
        eyebrow="Booking"
        heading={getContent(content, "schedule.heading")}
        subheading={getContent(content, "schedule.subheading")}
      />

      <section className="section">
        <div className="container-vp">
          <ScheduleGrid dateKeys={dateKeys} addons={addons} initialCourt={searchParams.court} />
        </div>
      </section>

      {/* Pricing guide */}
      <section className="pb-20">
        <div className="container-vp">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-ink">Pricing Guide</h2>
            <p className="text-sm text-ink/50">
              Peak hours: {String(addons.peakStart).padStart(2, "0")}:00–{String(addons.peakEnd).padStart(2, "0")}:00
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-black/10 text-xs uppercase text-ink/40">
                  <tr>
                    <th className="py-2">Court</th>
                    <th className="py-2">Standard / hr</th>
                    <th className="py-2">Peak / hr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {courtPrices.map((c) => (
                    <tr key={c.name}>
                      <td className="py-2 font-medium text-ink">{c.name}</td>
                      <td className="py-2 text-ink/70">{formatCurrency(c.normal)}</td>
                      <td className="py-2 text-pink-600">{formatCurrency(c.peak)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink/60">
              <span>Racket Rental: {formatCurrency(addons.racketRental)}</span>
              <span>Ball Rental: {formatCurrency(addons.ballRental)}</span>
              <span>Coaching: {formatCurrency(addons.coachingAddon)}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

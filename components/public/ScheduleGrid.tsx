"use client";

import { useCallback, useEffect, useState } from "react";
import { dayLabel } from "@/lib/utils";
import type { ScheduleResponse } from "@/lib/booking";
import { SlotPill } from "./SlotPill";
import { BookingModal, type BookingTarget, type AddonPricing } from "./BookingModal";

export function ScheduleGrid({
  dateKeys,
  addons,
  initialCourt,
}: {
  dateKeys: string[];
  addons: AddonPricing;
  initialCourt?: string;
}) {
  const [activeDate, setActiveDate] = useState(dateKeys[0]);
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [target, setTarget] = useState<BookingTarget | null>(null);
  const [activeCourtFilter, setActiveCourtFilter] = useState<string | undefined>(initialCourt);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/schedule?date=${date}`, { cache: "no-store" });
      if (!res.ok) {
        setError(true);
        setData(null);
        return;
      }
      const j = (await res.json()) as ScheduleResponse;
      setData(j);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(activeDate);
  }, [activeDate, load]);

  const courts = data?.courts.filter((c) => !activeCourtFilter || c.courtId === activeCourtFilter) ?? [];

  return (
    <div>
      {/* Date strip */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {dateKeys.map((dk) => {
          const { weekday, day } = dayLabel(dk);
          const active = dk === activeDate;
          return (
            <button
              key={dk}
              onClick={() => setActiveDate(dk)}
              className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2 text-sm transition ${active
                ? "border-brand bg-brand text-white"
                : "border-black/10 bg-white text-ink/70 hover:border-brand/30"
                }`}
            >
              <span className="text-xs opacity-70">{weekday}</span>
              <span className="text-lg font-semibold">{day}</span>
            </button>
          );
        })}
      </div>

      {/* Court filter chip */}
      {activeCourtFilter && (
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand-mint px-3 py-1.5 text-sm text-brand">
            Showing {data?.courts.find((c) => c.courtId === activeCourtFilter)?.courtName ?? "Court"} only
            <button
              onClick={() => setActiveCourtFilter(undefined)}
              aria-label="Show all courts"
              className="rounded-full p-0.5 hover:bg-brand/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>
          </span>
          <span className="text-sm text-ink/50">— Show all courts ×</span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink/60">
        <Legend color="bg-emerald-200" label="Available" />
        <Legend color="bg-pink-200" label="Peak" />
        <Legend color="bg-amber-200" label="Pending" />
        <Legend color="bg-gray-200" label="Booked / Closed" />
      </div>

      {/* Grid */}
      <div className="mt-4 overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-ink/40">Loading schedule…</div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-ink/60 mb-3">Failed to load schedule. Try again.</p>
            <button
              onClick={() => load(activeDate)}
              className="btn-outline px-5 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        ) : courts.length === 0 ? (
          <div className="py-16 text-center text-ink/40">No courts available.</div>
        ) : (
          <div className="min-w-[640px] space-y-4">
            {courts.map((court) => (
              <div key={court.courtId} className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{court.courtName}</h3>
                    <p className="text-xs text-ink/50">{court.courtType}</p>
                  </div>
                  {court.badge && (
                    <span className="badge bg-brand-accent text-brand-dark">{court.badge}</span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {court.slots.map((slot) => (
                    <SlotPill
                      key={slot.time}
                      time={slot.time}
                      state={slot.state}
                      onClick={() =>
                        setTarget({
                          courtId: court.courtId,
                          courtName: court.courtName,
                          courtType: court.courtType,
                          dateKey: activeDate,
                          startTime: slot.time,
                          priceNormal: court.priceNormal,
                          pricePeak: court.pricePeak,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {target && (
        <BookingModal
          target={target}
          addons={addons}
          onClose={() => setTarget(null)}
          onBooked={() => load(activeDate)}
        />
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded ${color}`} /> {label}
    </span>
  );
}

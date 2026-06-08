"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { cn, upcomingDateKeys, dayLabel, formatDateEn } from "@/lib/utils";
import type { ScheduleResponse, SlotState } from "@/lib/booking";

interface AdminCourt {
  id: string;
  name: string;
  isActive: boolean;
}

interface BlockRow {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  court: { name: string };
}

const STATE_STYLES: Record<SlotState, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer",
  peak: "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 cursor-pointer",
  booked: "bg-indigo-50 text-indigo-700 border-indigo-200 cursor-not-allowed",
  locked: "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed",
  blocked: "bg-gray-200 text-gray-500 border-gray-300 cursor-pointer line-through",
  closed: "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed",
};

const STATE_LABELS: Record<SlotState, string> = {
  available: "Open",
  peak: "Peak",
  booked: "Confirmed",
  locked: "Pending",
  blocked: "Blocked",
  closed: "—",
};

const LEGEND: { state: SlotState; label: string }[] = [
  { state: "available", label: "Available" },
  { state: "peak", label: "Peak" },
  { state: "locked", label: "Pending" },
  { state: "booked", label: "Confirmed" },
  { state: "blocked", label: "Blocked" },
  { state: "closed", label: "Closed / past" },
];

export default function AdminSchedulePage() {
  const dateKeys = upcomingDateKeys(7);
  const [date, setDate] = useState(dateKeys[0]);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [courts, setCourts] = useState<AdminCourt[]>([]);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Single-slot block confirmation target.
  const [blockTarget, setBlockTarget] = useState<{ courtId: string; courtName: string; time: string } | null>(null);
  const [blockReason, setBlockReason] = useState("");

  // Bulk block modal.
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ courtId: "", startTime: "07:00", endTime: "22:00", reason: "" });
  const [busy, setBusy] = useState(false);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    const [sRes, bRes] = await Promise.all([
      fetch(`/api/schedule?date=${date}`, { cache: "no-store" }),
      fetch(`/api/admin/blocks?date=${date}`, { cache: "no-store" }),
    ]);
    if (sRes.ok) setSchedule(await sRes.json());
    if (bRes.ok) setBlocks(await bRes.json());
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetch("/api/admin/courts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((cs: AdminCourt[]) => {
        const active = cs.filter((c) => c.isActive);
        setCourts(active);
        setBulk((b) => ({ ...b, courtId: active[0]?.id ?? "" }));
      });
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const timeSlots = schedule?.timeSlots ?? [];

  function onSlotClick(courtId: string, courtName: string, time: string, state: SlotState) {
    if (state === "blocked") {
      // Find and remove the block covering this slot.
      const hour = parseInt(time.split(":")[0], 10);
      const blk = blocks.find(
        (b) =>
          b.courtId === courtId &&
          parseInt(b.startTime.split(":")[0], 10) <= hour &&
          parseInt(b.endTime.split(":")[0], 10) > hour
      );
      if (blk && confirm(`Remove block on ${courtName} (${blk.startTime}–${blk.endTime})?`)) {
        removeBlock(blk.id);
      }
      return;
    }
    if (state === "available" || state === "peak") {
      setBlockReason("");
      setBlockTarget({ courtId, courtName, time });
    }
  }

  async function confirmSingleBlock() {
    if (!blockTarget) return;
    setBusy(true);
    const hour = parseInt(blockTarget.time.split(":")[0], 10);
    await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courtId: blockTarget.courtId,
        date,
        startTime: blockTarget.time,
        endTime: `${String(hour + 1).padStart(2, "0")}:00`,
        reason: blockReason,
      }),
    });
    setBusy(false);
    setBlockTarget(null);
    loadSchedule();
  }

  async function confirmBulkBlock() {
    if (!bulk.courtId) return;
    if (parseInt(bulk.endTime) <= parseInt(bulk.startTime)) {
      alert("End time must be after start time.");
      return;
    }
    setBusy(true);
    await fetch("/api/admin/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...bulk, date }),
    });
    setBusy(false);
    setBulkOpen(false);
    loadSchedule();
  }

  async function removeBlock(id: string) {
    await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
    loadSchedule();
  }

  return (
    <>
      <PageHeader
        title="Schedule & Availability"
        description="View the grid, block slots for maintenance or events, and manage existing blocks."
        action={
          <button onClick={() => setBulkOpen(true)} className="btn-primary" disabled={!courts.length}>
            + Bulk Block
          </button>
        }
      />

      {/* Date strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {dateKeys.map((k) => {
          const { weekday, day } = dayLabel(k);
          const active = k === date;
          return (
            <button
              key={k}
              onClick={() => setDate(k)}
              className={cn(
                "flex min-w-[60px] flex-col items-center rounded-xl border px-3 py-2 text-sm transition",
                active ? "border-brand bg-brand text-white" : "border-black/10 bg-white text-ink hover:border-brand/40"
              )}
            >
              <span className="text-xs opacity-70">{weekday}</span>
              <span className="font-semibold">{day}</span>
            </button>
          );
        })}
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="input ml-auto max-w-[170px]"
        />
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs text-ink/60">
        {LEGEND.map((l) => (
          <span key={l.state} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-3 w-3 rounded border", STATE_STYLES[l.state])} />
            {l.label}
          </span>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <p className="mb-3 text-sm text-ink/50">{formatDateEn(date)} — click an open slot to block it, or a blocked slot to release it.</p>
        {loading || !schedule ? (
          <p className="py-10 text-center text-sm text-ink/40">Loading schedule…</p>
        ) : schedule.courts.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink/40">No active courts. Add courts first.</p>
        ) : (
          <table className="w-full border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left text-ink/40">Court</th>
                {timeSlots.map((t) => (
                  <th key={t} className="px-1 py-1 font-medium text-ink/40">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.courts.map((court) => (
                <tr key={court.courtId}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 py-1 text-left font-medium text-ink">
                    {court.courtName}
                  </td>
                  {court.slots.map((slot) => (
                    <td key={slot.time} className="p-0">
                      <button
                        type="button"
                        title={slot.refNumber ? `${STATE_LABELS[slot.state]} · ${slot.refNumber}` : STATE_LABELS[slot.state]}
                        onClick={() => onSlotClick(court.courtId, court.courtName, slot.time, slot.state)}
                        className={cn(
                          "h-9 w-full rounded border text-[10px] font-medium transition",
                          STATE_STYLES[slot.state]
                        )}
                      >
                        {STATE_LABELS[slot.state]}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Active blocks list */}
      <Card className="mt-5">
        <h2 className="mb-3 font-semibold text-ink">Blocks on {formatDateEn(date)}</h2>
        {blocks.length === 0 ? (
          <p className="text-sm text-ink/40">No blocks for this date.</p>
        ) : (
          <ul className="divide-y divide-black/5 text-sm">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2">
                <span>
                  <span className="font-medium text-ink">{b.court.name}</span>
                  <span className="text-ink/50"> · {b.startTime}–{b.endTime}</span>
                  {b.reason && <span className="text-ink/40"> · {b.reason}</span>}
                </span>
                <button onClick={() => removeBlock(b.id)} className="btn-ghost px-3 py-1 !text-red-600">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Single slot block confirm */}
      {blockTarget && (
        <Modal
          title="Block slot"
          onClose={() => setBlockTarget(null)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setBlockTarget(null)} className="btn-ghost">Cancel</button>
              <button onClick={confirmSingleBlock} disabled={busy} className="btn-primary">{busy ? "Blocking…" : "Block slot"}</button>
            </div>
          }
        >
          <p className="text-sm text-ink/70">
            Block <strong>{blockTarget.courtName}</strong> at <strong>{blockTarget.time}</strong> on {formatDateEn(date)}.
          </p>
          <div className="mt-3">
            <label className="label">Reason (internal, optional)</label>
            <input className="input" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="e.g. Maintenance" />
          </div>
        </Modal>
      )}

      {/* Bulk block */}
      {bulkOpen && (
        <Modal
          title="Bulk block"
          onClose={() => setBulkOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button onClick={() => setBulkOpen(false)} className="btn-ghost">Cancel</button>
              <button onClick={confirmBulkBlock} disabled={busy} className="btn-primary">{busy ? "Blocking…" : "Block range"}</button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-ink/50">Block a time range on a court for {formatDateEn(date)}.</p>
            <div>
              <label className="label">Court</label>
              <select className="input" value={bulk.courtId} onChange={(e) => setBulk({ ...bulk, courtId: e.target.value })}>
                {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start</label>
                <select className="input" value={bulk.startTime} onChange={(e) => setBulk({ ...bulk, startTime: e.target.value })}>
                  {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">End</label>
                <select className="input" value={bulk.endTime} onChange={(e) => setBulk({ ...bulk, endTime: e.target.value })}>
                  {[...timeSlots.slice(1), "23:00"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Reason (internal, optional)</label>
              <input className="input" value={bulk.reason} onChange={(e) => setBulk({ ...bulk, reason: e.target.value })} placeholder="e.g. Private event" />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

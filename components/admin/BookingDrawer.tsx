"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { Countdown } from "./Countdown";
import { formatCurrency, formatDateEn } from "@/lib/utils";
import { simpleWaLink } from "@/lib/whatsapp";

export interface AdminBooking {
  id: string;
  refNumber: string;
  court: { name: string; type: string };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  bookerName: string;
  bookerWa: string;
  players: number;
  addonRacket: boolean;
  addonBall: boolean;
  addonCoaching: boolean;
  notes: string | null;
  adminNotes: string | null;
  estimatedTotal: number;
  memberRef: string | null;
  memberDiscount: number;
  status: string;
  lockedUntil: string;
  createdAt: string;
}

export function BookingDrawer({
  booking,
  paymentTemplate,
  onClose,
  onChanged,
}: {
  booking: AdminBooking;
  paymentTemplate: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(booking.adminNotes ?? "");
  const [error, setError] = useState("");

  // Escape to close + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const dateKey = booking.date.slice(0, 10);
  const addons = [
    booking.addonRacket && "Racket Rental",
    booking.addonBall && "Ball Rental",
    booking.addonCoaching && "Coaching",
  ].filter(Boolean) as string[];

  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      let res: Response;
      if (action === "extend") {
        res = await fetch(`/api/admin/bookings/${booking.id}/extend-lock`, { method: "POST" });
      } else if (action === "delete") {
        res = await fetch(`/api/admin/bookings/${booking.id}`, { method: "DELETE" });
      } else {
        res = await fetch(`/api/admin/bookings/${booking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, adminNotes: notes }),
        });
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Action "${action}" failed.`);
      }
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes.");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const waText = `Halo ${booking.bookerName}! Ini tim Vista Padel Club.\n\nBooking kamu (Ref: ${booking.refNumber}).\nCourt: ${booking.court.name} | ${formatDateEn(dateKey)} | ${booking.startTime} (${booking.duration} jam)\nTotal: ${formatCurrency(booking.estimatedTotal)}\n\n${paymentTemplate}\n\nSetelah transfer, kirim bukti ke sini ya. Terima kasih!`;

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Booking ${booking.refNumber}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-lift animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <p className="font-mono text-sm font-bold text-brand">{booking.refNumber}</p>
            <StatusBadge status={booking.status} />
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink/50 transition hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 p-5 text-sm">
          {/* Booking info grid */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
            <Info label="Court" value={booking.court.name} />
            <Info label="Type" value={booking.court.type} />
            <Info label="Date" value={formatDateEn(dateKey)} />
            <Info label="Time" value={`${booking.startTime}–${booking.endTime}`} />
            <Info label="Duration" value={`${booking.duration}h`} />
            <Info label="Players" value={String(booking.players)} />
          </div>

          {/* Booker */}
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/40">Booker</p>
            <p className="mt-1 font-semibold text-ink">{booking.bookerName}</p>
            <p className="text-ink/60">{booking.bookerWa}</p>
          </div>

          {addons.length > 0 && <Info label="Add-ons" value={addons.join(", ")} />}
          {booking.notes && (
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase text-amber-700">Note from booker</p>
              <p className="mt-1 text-ink/70">{booking.notes}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-ink/50">Estimated total</span>
            <span className="text-base font-bold text-brand">{formatCurrency(booking.estimatedTotal)}</span>
          </div>

          {booking.memberRef && booking.memberDiscount > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm">
              <span className="text-emerald-700">⭐ Member discount ({booking.memberDiscount}%)</span>
              <span className="font-medium text-emerald-700">{booking.memberRef}</span>
            </div>
          )}

          {/* Lock countdown */}
          {booking.status === "PENDING" && (
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-sm text-amber-800">Lock expires in</span>
              <Countdown until={booking.lockedUntil} />
            </div>
          )}

          {/* Contact booker */}
          <a
            href={simpleWaLink(booking.bookerWa, waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full"
          >
            💬 Contact Booker on WhatsApp
          </a>

          {/* Admin notes */}
          <div>
            <label className="label">Admin notes (internal)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Internal notes visible only to admins…"
            />
            <button
              onClick={saveNotes}
              disabled={busy}
              className="btn-ghost mt-1.5 px-3 py-1.5 text-xs"
            >
              {busy ? "Saving…" : "Save notes"}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 border-t border-black/5 p-5">
          {booking.status === "PENDING" && (
            <>
              <button
                onClick={() => act("confirm")}
                disabled={busy}
                className="btn-primary w-full"
              >
                ✓ Confirm Booking
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => act("reject")}
                  disabled={busy}
                  className="btn-outline flex-1 !border-red-200 !text-red-600 hover:!bg-red-50"
                >
                  Reject
                </button>
                <button
                  onClick={() => act("extend")}
                  disabled={busy}
                  className="btn-outline flex-1"
                >
                  Extend +30m
                </button>
              </div>
            </>
          )}
          {booking.status === "CONFIRMED" && (
            <button
              onClick={() => act("cancel")}
              disabled={busy}
              className="btn-outline w-full !border-red-200 !text-red-600 hover:!bg-red-50"
            >
              Cancel Booking
            </button>
          )}
          {["REJECTED", "EXPIRED", "CANCELLED"].includes(booking.status) && (
            <button
              onClick={() => act("delete")}
              disabled={busy}
              className="btn-outline w-full !border-red-200 !text-red-600 hover:!bg-red-50"
            >
              Delete record
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-0.5 font-medium text-ink">{value}</p>
    </div>
  );
}

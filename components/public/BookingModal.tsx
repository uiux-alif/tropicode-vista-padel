"use client";

import { useEffect, useMemo, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { calculatePrice } from "@/lib/pricing";
import { formatCurrency, formatDateEn } from "@/lib/utils";

export interface BookingTarget {
  courtId: string;
  courtName: string;
  courtType: string;
  dateKey: string;
  startTime: string;
  priceNormal: number;
  pricePeak: number;
}

export interface AddonPricing {
  racketRental: number;
  ballRental: number;
  coachingAddon: number;
  peakStart: number;
  peakEnd: number;
}

interface MemberInfo {
  found: true;
  refNumber: string;
  name: string;
  planName: string;
  discountPercent: number;
  expiresAt: string;
}

interface SuccessData {
  refNumber: string;
  waLink: string;
  discountSaved: number;
}

export function BookingModal({
  target,
  addons,
  onClose,
  onBooked,
}: {
  target: BookingTarget;
  addons: AddonPricing;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [duration, setDuration] = useState(1);
  const [players, setPlayers] = useState(2);
  const [addonRacket, setAddonRacket] = useState(false);
  const [addonBall, setAddonBall] = useState(false);
  const [addonCoaching, setAddonCoaching] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<SuccessData | null>(null);

  // Member discount state
  const [memberWa, setMemberWa] = useState("");
  const [memberLookupBusy, setMemberLookupBusy] = useState(false);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [memberLookupError, setMemberLookupError] = useState(false);

  const ph = usePostHog();

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const startHour = parseInt(target.startTime.split(":")[0], 10);
  const maxDuration = Math.min(3, Math.max(1, 23 - startHour));
  const durationOptions = Array.from({ length: maxDuration }, (_, i) => i + 1);

  // Fix duration clamping with useEffect instead of during render
  useEffect(() => {
    if (duration > maxDuration) setDuration(maxDuration);
  }, [maxDuration, duration]);

  const breakdown = useMemo(
    () =>
      calculatePrice({
        startHour,
        duration,
        priceNormal: target.priceNormal,
        pricePeak: target.pricePeak,
        peakStart: addons.peakStart,
        peakEnd: addons.peakEnd,
        addonRacket,
        addonBall,
        addonCoaching,
        racketRental: addons.racketRental,
        ballRental: addons.ballRental,
        coachingAddon: addons.coachingAddon,
        memberDiscountPercent: memberInfo?.discountPercent ?? 0,
      }),
    [startHour, duration, target, addons, addonRacket, addonBall, addonCoaching, memberInfo]
  );

  // When the user enters their WA as the booker, pre-fill the member lookup
  useEffect(() => {
    if (wa.length >= 8 && !memberInfo && !memberNotFound) {
      setMemberWa(wa);
    }
  }, [wa, memberInfo, memberNotFound]);

  async function lookupMember() {
    const q = memberWa.trim() || wa.trim();
    if (!q) return;
    setMemberLookupBusy(true);
    setMemberNotFound(false);
    setMemberInfo(null);
    setMemberLookupError(false);
    try {
      const res = await fetch(`/api/member/verify?wa=${encodeURIComponent(q)}`);
      const j = await res.json();
      if (j.found) {
        setMemberInfo(j as MemberInfo);
        // Pre-fill the name if it matches and the booker name is empty
        if (!name.trim()) setName(j.name);
      } else {
        setMemberNotFound(true);
      }
    } catch {
      setMemberNotFound(true);
      setMemberLookupError(true);
    } finally {
      setMemberLookupBusy(false);
    }
  }

  function clearMember() {
    setMemberInfo(null);
    setMemberNotFound(false);
    setMemberWa("");
    setMemberLookupError(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !/^[0-9+\-\s]{8,}$/.test(wa)) {
      setError("Please enter a valid name and WhatsApp number.");
      return;
    }
    setSubmitting(true);
    ph?.capture("booking_attempted", {
      court_id: target.courtId,
      court_name: target.courtName,
      date: target.dateKey,
      start_time: target.startTime,
      duration,
      estimated_total: breakdown.total,
      member_discount: memberInfo?.discountPercent ?? 0,
    });
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: target.courtId,
          date: target.dateKey,
          startTime: target.startTime,
          duration,
          bookerName: name.trim(),
          bookerWa: wa.trim(),
          players,
          addonRacket,
          addonBall,
          addonCoaching,
          notes: notes.trim() || undefined,
          memberRef: memberInfo?.refNumber,
          memberDiscount: memberInfo?.discountPercent ?? 0,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        ph?.capture("booking_failed", { court_id: target.courtId, error: j.error, status: res.status });
        throw new Error(j.error ?? "Booking failed. Please try again.");
      }
      ph?.capture("booking_submitted", {
        ref_number: j.refNumber,
        court_id: target.courtId,
        court_name: target.courtName,
        date: target.dateKey,
        start_time: target.startTime,
        duration,
        players,
        estimated_total: breakdown.total,
        member_discount: memberInfo?.discountPercent ?? 0,
        discount_saved: j.discountSaved ?? 0,
      });
      setSuccess({ refNumber: j.refNumber, waLink: j.waLink, discountSaved: j.discountSaved ?? 0 });
      onBooked();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[100vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:max-h-[92vh] sm:rounded-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">
            {success ? "Booking Request Sent" : "Book a Slot"}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink/50 hover:bg-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ── SUCCESS SCREEN ────────────────────────────────────── */}
        {success ? (
          <div className="overflow-y-auto p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">✅</div>
            <h3 className="mt-4 text-xl font-bold text-ink">Booking Request Sent!</h3>
            <p className="mt-1 text-sm text-ink/50">Reference</p>
            <p className="font-mono text-lg font-bold text-brand">{success.refNumber}</p>

            <div className="mt-4 rounded-xl bg-brand-mint/50 p-4 text-left text-sm text-ink/70 space-y-1">
              <p><strong>{target.courtName}</strong> ({target.courtType})</p>
              <p>{formatDateEn(target.dateKey)}</p>
              <p>{target.startTime} · {duration} hour{duration > 1 ? "s" : ""} · {players} players</p>
            </div>

            {success.discountSaved > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand-mint/50 px-4 py-3 text-sm text-brand">
                <span>🎉</span>
                <span>Member discount saved you <strong>{formatCurrency(success.discountSaved)}</strong></span>
              </div>
            )}

            <p className="mt-4 text-sm text-ink/60">
              Our team will contact you on WhatsApp as soon as possible to confirm.
            </p>
            <a
              href={success.waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => ph?.capture("booking_wa_clicked", { ref_number: success.refNumber })}
              className="btn-primary mt-5 w-full"
            >
              Confirm via WhatsApp →
            </a>
            <button onClick={onClose} className="btn-ghost mt-2 w-full">Done</button>
          </div>
        ) : (
          /* ── BOOKING FORM ───────────────────────────────────────── */
          <form onSubmit={submit} className="flex flex-col overflow-hidden">
            <div className="space-y-4 overflow-y-auto px-5 py-4">

              {/* Slot context */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-brand-mint/50 p-3 text-sm">
                <div><span className="text-ink/40">Court</span><div className="font-medium">{target.courtName}</div></div>
                <div><span className="text-ink/40">Type</span><div className="font-medium">{target.courtType}</div></div>
                <div><span className="text-ink/40">Date</span><div className="font-medium">{formatDateEn(target.dateKey)}</div></div>
                <div><span className="text-ink/40">Start</span><div className="font-medium">{target.startTime}</div></div>
              </div>

              {/* Name + WA */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="bk-name">Full Name *</label>
                  <input
                    id="bk-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input"
                    placeholder="Your name"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="label" htmlFor="bk-wa">WhatsApp Number *</label>
                  <input
                    id="bk-wa"
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                    type="tel"
                    required
                    className="input"
                    placeholder="08xxxxxxxxxx"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* ── MEMBER DISCOUNT SECTION ───────────────────────── */}
              <div className="rounded-xl border border-black/8 bg-gray-50">
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <span className="text-sm font-semibold text-ink">⭐ Member Discount</span>
                  <span className="rounded-full bg-brand-accent/20 px-2 py-0.5 text-xs font-medium text-brand">
                    Up to 25% off
                  </span>
                </div>

                {!memberInfo ? (
                  <div className="px-4 pb-3">
                    <p className="mb-2 text-xs text-ink/50">
                      Are you a Vista Padel member? Enter your registered WhatsApp to apply your discount.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={memberWa}
                        onChange={(e) => { setMemberWa(e.target.value); setMemberNotFound(false); setMemberLookupError(false); }}
                        placeholder="Registered WA number"
                        className="input flex-1 text-sm"
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={lookupMember}
                        disabled={memberLookupBusy || memberWa.length < 8 || submitting}
                        className="btn-outline shrink-0 px-4 py-2 text-sm"
                      >
                        {memberLookupBusy ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                        ) : "Check"}
                      </button>
                    </div>
                    {memberNotFound && !memberLookupError && (
                      <p className="mt-1.5 text-xs text-ink/50">
                        No active membership found for that number.{" "}
                        <a href="/membership" target="_blank" className="text-brand underline">View plans →</a>
                      </p>
                    )}
                    {memberLookupError && (
                      <p className="mt-1.5 text-xs text-red-600">
                        Could not check membership — try again.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-emerald-700">
                          ✅ {memberInfo.planName} Member
                        </p>
                        <p className="text-xs text-emerald-600">
                          {memberInfo.name} · {memberInfo.discountPercent}% off court fees applied
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearMember}
                        className="rounded-full p-1 text-emerald-600 hover:bg-emerald-100"
                        aria-label="Remove member discount"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Duration + players */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="bk-dur">Duration</label>
                  <select
                    id="bk-dur"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input"
                    disabled={submitting}
                  >
                    {durationOptions.map((d) => (
                      <option key={d} value={d}>{d} hour{d > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="bk-players">Players</label>
                  <select
                    id="bk-players"
                    value={players}
                    onChange={(e) => setPlayers(Number(e.target.value))}
                    className="input"
                    disabled={submitting}
                  >
                    <option value={2}>2 players</option>
                    <option value={3}>3 players</option>
                    <option value={4}>4 players</option>
                  </select>
                </div>
              </div>

              {/* Add-ons */}
              <div>
                <span className="label">Add-ons</span>
                <div className="flex flex-wrap gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addonRacket}
                      onChange={(e) => setAddonRacket(e.target.checked)}
                      disabled={submitting}
                    />
                    Racket Rental ({formatCurrency(addons.racketRental)})
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addonBall}
                      onChange={(e) => setAddonBall(e.target.checked)}
                      disabled={submitting}
                    />
                    Ball Rental ({formatCurrency(addons.ballRental)})
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={addonCoaching}
                      onChange={(e) => setAddonCoaching(e.target.checked)}
                      disabled={submitting}
                    />
                    Coaching ({formatCurrency(addons.coachingAddon)})
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="label" htmlFor="bk-notes">Notes (optional)</label>
                <textarea
                  id="bk-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="input"
                  placeholder="Any requests?"
                  disabled={submitting}
                />
              </div>

              {/* Price estimator */}
              <div className="rounded-xl border border-black/5 bg-gray-50 p-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/40">Price Estimate</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-ink/60">
                    <span>Court fee ({duration}h{breakdown.hasPeak ? " · incl. peak" : " · off-peak"})</span>
                    <span className={breakdown.memberDiscount > 0 ? "line-through text-ink/40" : "font-medium text-ink"}>
                      {formatCurrency(breakdown.courtFee)}
                    </span>
                  </div>
                  {breakdown.memberDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-emerald-600">
                        <span>Member discount ({breakdown.memberDiscountPercent}% off)</span>
                        <span className="font-medium">−{formatCurrency(breakdown.memberDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-ink/80">
                        <span>Court fee (after discount)</span>
                        <span className="font-medium">{formatCurrency(breakdown.courtFeeAfterDiscount)}</span>
                      </div>
                    </>
                  )}
                  {breakdown.addonsDetail.map((a) => (
                    <div key={a.label} className="flex justify-between text-ink/60">
                      <span>{a.label}</span>
                      <span>{formatCurrency(a.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
                  <span className="text-sm font-semibold text-ink">Estimated Total</span>
                  <span className="text-lg font-bold text-brand">{formatCurrency(breakdown.total)}</span>
                </div>
                {breakdown.memberDiscount > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    🎉 You save {formatCurrency(breakdown.memberDiscount)} with your membership
                  </p>
                )}
                <p className="mt-1 text-xs text-ink/40">Estimated only — confirmed via WhatsApp.</p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
              )}
            </div>

            <div className="shrink-0 border-t border-black/5 p-4">
              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? "Submitting…" : "Submit Booking Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

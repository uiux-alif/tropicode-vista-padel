"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateEn, toDateKey } from "@/lib/utils";
import { memberConfirmationLink } from "@/lib/whatsapp";

export interface AdminMember {
  id: string;
  refNumber: string;
  name: string;
  waNumber: string;
  email: string | null;
  planId: string;
  plan: { id: string; name: string; price: number; billingPeriod: string };
  status: string;
  startDate: string;
  expiresAt: string;
  billingPeriod: string;
  paidAmount: number;
  notes: string | null;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green",
  PAUSED: "amber",
  EXPIRED: "red",
  CANCELLED: "gray",
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function MemberDrawer({
  member,
  onClose,
  onChanged,
  openRenew,
}: {
  member: AdminMember;
  onClose: () => void;
  onChanged: () => void;
  openRenew?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(member.notes ?? "");
  const [error, setError] = useState("");
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewAmount, setRenewAmount] = useState(String(member.plan.price));
  const [renewNotes, setRenewNotes] = useState("");

  // Open renew modal directly if openRenew prop is set
  useEffect(() => {
    if (openRenew) setShowRenewModal(true);
  }, [openRenew]);

  // Escape to close + scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRenewModal) setShowRenewModal(false);
        else onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, showRenewModal]);

  const days = daysUntil(member.expiresAt);
  const isExpired = days < 0;
  const isExpiringSoon = !isExpired && days <= 7;

  async function act(action: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
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
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes.");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRenew() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/members/${member.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: Number(renewAmount), notes: renewNotes || undefined }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Renew failed.");
      }
      setShowRenewModal(false);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const startKey = toDateKey(new Date(member.startDate));
  const expiryKey = toDateKey(new Date(member.expiresAt));

  const waLink = memberConfirmationLink(member.waNumber, {
    refNumber: member.refNumber,
    name: member.name,
    planName: member.plan.name,
    billingPeriod: member.billingPeriod,
    startDate: formatDateEn(startKey),
    expiresAt: formatDateEn(expiryKey),
    clubName: "Vista Padel Club",
  });

  // Calculate new expiry for renew preview
  function calcNewExpiry(): string {
    const from = new Date(member.expiresAt) > new Date() ? new Date(member.expiresAt) : new Date();
    const d = new Date(from);
    const bp = member.billingPeriod.toLowerCase();
    if (bp === "monthly") d.setMonth(d.getMonth() + 1);
    else if (bp === "quarterly") d.setMonth(d.getMonth() + 3);
    else if (bp === "annual") d.setMonth(d.getMonth() + 12);
    else d.setMonth(d.getMonth() + 1);
    return formatDateEn(toDateKey(d));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Member ${member.refNumber}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-lift animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div>
            <p className="font-mono text-sm font-bold text-brand">{member.refNumber}</p>
            <Badge variant={STATUS_VARIANT[member.status] ?? "gray"}>{member.status}</Badge>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink/50 transition hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 p-5 text-sm">
          {/* Member info */}
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/40">Member</p>
            <p className="mt-1 font-semibold text-ink">{member.name}</p>
            <p className="text-ink/60">{member.waNumber}</p>
            {member.email && <p className="text-ink/60">{member.email}</p>}
          </div>

          {/* Plan + dates */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4">
            <Info label="Plan" value={member.plan.name} />
            <Info label="Billing" value={member.billingPeriod} />
            <Info label="Start" value={formatDateEn(startKey)} />
            <Info label="Expires" value={formatDateEn(expiryKey)} />
          </div>

          {/* Days remaining */}
          <div
            className={
              isExpired
                ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3"
                : isExpiringSoon
                  ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                  : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
            }
          >
            <p
              className={
                isExpired
                  ? "font-semibold text-red-700"
                  : isExpiringSoon
                    ? "font-semibold text-amber-700"
                    : "font-semibold text-emerald-700"
              }
            >
              {isExpired
                ? `⚠️ Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`
                : isExpiringSoon
                  ? `⏰ Expires in ${days} day${days !== 1 ? "s" : ""}`
                  : `✅ ${days} day${days !== 1 ? "s" : ""} remaining`}
            </p>
          </div>

          {/* Paid amount */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <span className="text-ink/50">Last paid</span>
            <span className="font-bold text-brand">{formatCurrency(member.paidAmount)}</span>
          </div>

          {/* WhatsApp confirmation */}
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full text-center"
          >
            💬 Send WhatsApp Confirmation
          </a>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Add notes…"
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
          {(member.status === "ACTIVE" || member.status === "PAUSED" || member.status === "EXPIRED") && (
            <button
              onClick={() => setShowRenewModal(true)}
              disabled={busy}
              className="btn-primary w-full"
            >
              🔄 Renew Membership
            </button>
          )}
          <div className="flex gap-2">
            {member.status === "ACTIVE" && (
              <button
                onClick={() => act("pause")}
                disabled={busy}
                className="btn-outline flex-1"
              >
                ⏸ Pause
              </button>
            )}
            {member.status === "PAUSED" && (
              <button
                onClick={() => act("reactivate")}
                disabled={busy}
                className="btn-outline flex-1 !border-emerald-200 !text-emerald-600 hover:!bg-emerald-50"
              >
                ▶ Reactivate
              </button>
            )}
            {member.status !== "CANCELLED" && (
              <button
                onClick={() => act("cancel")}
                disabled={busy}
                className="btn-outline flex-1 !border-red-200 !text-red-600 hover:!bg-red-50"
              >
                ✕ Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowRenewModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Renew Membership"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <h2 className="text-lg font-semibold text-ink">Renew Membership</h2>
              <button
                onClick={() => setShowRenewModal(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-ink/50 hover:bg-gray-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="space-y-4 px-5 py-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink/50">Current expiry</span>
                  <span className="font-medium text-ink">{formatDateEn(expiryKey)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">New expiry</span>
                  <span className="font-semibold text-emerald-600">{calcNewExpiry()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/50">Billing period</span>
                  <span className="font-medium text-ink">{member.billingPeriod}</span>
                </div>
              </div>
              <div>
                <label className="label">Paid Amount (IDR)</label>
                <input
                  type="number"
                  className="input"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(e.target.value)}
                  min={0}
                />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={renewNotes}
                  onChange={(e) => setRenewNotes(e.target.value)}
                  placeholder="Renewal notes…"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}
            </div>
            <div className="border-t border-black/5 px-5 py-4">
              <button
                onClick={handleRenew}
                disabled={busy}
                className="btn-primary w-full"
              >
                {busy ? "Processing…" : "✓ Confirm Renewal"}
              </button>
            </div>
          </div>
        </div>
      )}
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

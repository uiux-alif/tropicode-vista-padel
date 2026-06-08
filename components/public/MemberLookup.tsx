"use client";

import { useState } from "react";
import { formatDateEn, toDateKey } from "@/lib/utils";

interface MemberResult {
  found: boolean;
  refNumber?: string;
  name?: string;
  planName?: string;
  discountPercent?: number;
  expiresAt?: string;
}

function daysUntil(iso: string): number {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const exp = new Date(iso); exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / 86400000);
}

export function MemberLookup() {
  const [wa, setWa] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MemberResult | null>(null);
  const [error, setError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!wa.trim()) return;
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const res = await fetch(`/api/member/verify?wa=${encodeURIComponent(wa.trim())}`);
      if (!res.ok) throw new Error("Lookup failed.");
      setResult(await res.json());
    } catch {
      setError("Could not check membership. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setWa("");
    setResult(null);
    setError("");
  }

  const days = result?.found && result.expiresAt ? daysUntil(result.expiresAt) : null;
  const hasResult = result !== null || error !== "";

  return (
    <div className="card p-6">
      <form onSubmit={lookup} className="flex gap-2">
        <input
          type="tel"
          value={wa}
          onChange={(e) => { setWa(e.target.value); setResult(null); }}
          placeholder="Your WhatsApp number (08xxx)"
          className="input flex-1"
          aria-label="WhatsApp number"
        />
        <button
          type="submit"
          disabled={busy || wa.trim().length < 8}
          className="btn-primary shrink-0 px-5"
        >
          {busy ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : "Check"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {result && !result.found && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-black/5 bg-gray-50 p-4 text-sm">
          <span className="mt-0.5 text-2xl">🔍</span>
          <div>
            <p className="font-medium text-ink">No active membership found</p>
            <p className="mt-0.5 text-ink/60">
              That number isn&apos;t registered as an active member.{" "}
              <a href="/membership#plans" className="text-brand underline">View plans →</a>
            </p>
          </div>
        </div>
      )}

      {result?.found && result.name && (
        <div className={`mt-4 rounded-xl border p-4 ${days !== null && days < 0
          ? "border-red-200 bg-red-50"
          : days !== null && days <= 7
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
          }`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">
              {days !== null && days < 0 ? "⚠️" : days !== null && days <= 7 ? "⏰" : "✅"}
            </span>
            <div className="flex-1">
              <p className={`font-semibold ${days !== null && days < 0 ? "text-red-700"
                : days !== null && days <= 7 ? "text-amber-700"
                  : "text-emerald-700"
                }`}>
                {result.name} — {result.planName} Member
              </p>
              <p className={`mt-1 text-sm ${days !== null && days < 0 ? "text-red-600"
                : days !== null && days <= 7 ? "text-amber-600"
                  : "text-emerald-600"
                }`}>
                {days !== null && days < 0
                  ? `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`
                  : days === 0
                    ? "Expires today"
                    : days !== null && days <= 7
                      ? `Expires in ${days} day${days !== 1 ? "s" : ""}`
                      : result.expiresAt
                        ? `Valid until ${formatDateEn(toDateKey(new Date(result.expiresAt)))}`
                        : "Active"}
              </p>
              {(result.discountPercent ?? 0) > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-brand-accent/20 px-2.5 py-0.5 text-xs font-bold text-brand">
                    {result.discountPercent}% off court fees
                  </span>
                  <span className="text-xs text-ink/50">Ref: {result.refNumber}</span>
                </div>
              )}
              {days !== null && days <= 7 && days >= 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Renew now to keep your discount. Message us on WhatsApp →
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search again button after result */}
      {hasResult && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="text-sm text-ink/50 hover:text-brand underline"
          >
            × Search again
          </button>
        </div>
      )}
    </div>
  );
}

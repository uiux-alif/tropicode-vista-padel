"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingDrawer, type AdminBooking } from "@/components/admin/BookingDrawer";
import { formatCurrency, formatDateEn, toDateKey } from "@/lib/utils";

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "REJECTED", "EXPIRED", "CANCELLED"];

function BookingsInner() {
  const params = useSearchParams();
  const today = toDateKey(new Date());

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(params.get("status") ?? "ALL");
  const [courtId, setCourtId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [paymentTemplate, setPaymentTemplate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== "ALL") qs.set("status", status);
    if (courtId !== "ALL") qs.set("courtId", courtId);
    if (search) qs.set("search", search);
    if (dateFrom) qs.set("from", dateFrom);
    if (dateTo) qs.set("to", dateTo);
    const res = await fetch(`/api/admin/bookings?${qs.toString()}`, { cache: "no-store" });
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [status, courtId, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    // Load courts for filter dropdown
    fetch("/api/courts")
      .then((r) => r.ok ? r.json() : [])
      .then((c: { id: string; name: string }[]) => setCourts(c))
      .catch(() => { });

    // Load payment template from admin content API (auth-protected)
    fetch("/api/admin/content", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : {})
      .then((c: Record<string, string>) => setPaymentTemplate(c["settings.paymentTemplate"] ?? ""))
      .catch(() => { });
  }, []);

  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Manage and confirm booking requests."
      />

      {pendingCount > 0 && (
        <button
          onClick={() => setStatus("PENDING")}
          className="mb-4 flex w-full items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-left text-amber-800 transition hover:bg-amber-100"
        >
          <span className="font-medium">⏳ {pendingCount} pending booking{pendingCount > 1 ? "s" : ""} need attention</span>
          <span className="text-sm underline">Filter →</span>
        </button>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input max-w-[160px]"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All statuses" : s}</option>
            ))}
          </select>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="input max-w-[180px]"
            aria-label="Filter by court"
          >
            <option value="ALL">All courts</option>
            {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name / WA / ref…"
            className="input min-w-[180px] flex-1"
            aria-label="Search bookings"
          />
          <div className="flex items-center gap-2 text-sm text-ink/50">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input w-[150px]"
              aria-label="From date"
            />
            <span>→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input w-[150px]"
              aria-label="To date"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); }}
                className="text-xs text-brand hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="py-16 text-center text-ink/40">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase text-ink/40">
                <tr>
                  <th className="py-2 pr-4">Ref</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Court</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Booker</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className="cursor-pointer transition hover:bg-brand-mint/30"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-ink/60">{b.refNumber}</td>
                    <td className="py-3 pr-4 text-ink/70">{formatDateEn(b.date.slice(0, 10))}</td>
                    <td className="py-3 pr-4 font-medium text-ink">{b.court.name}</td>
                    <td className="py-3 pr-4 text-ink/70">{b.startTime}–{b.endTime}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-ink">{b.bookerName}</div>
                      <div className="text-xs text-ink/40">{b.bookerWa}</div>
                    </td>
                    <td className="py-3 pr-4 font-medium text-brand">{formatCurrency(b.estimatedTotal)}</td>
                    <td className="py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <BookingDrawer
          booking={selected}
          paymentTemplate={paymentTemplate}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      )}
    </>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink/40">Loading…</p>}>
      <BookingsInner />
    </Suspense>
  );
}

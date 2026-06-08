"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, StatCard, Card } from "@/components/admin/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Countdown } from "@/components/admin/Countdown";
import { formatCurrency } from "@/lib/utils";
import { simpleWaLink } from "@/lib/whatsapp";

interface DashboardData {
  todayCount: number;
  pendingCount: number;
  availableToday: number;
  revenueWeek: number;
  expiringMembers: number;
  activeMembers: number;
  todays: {
    id: string;
    refNumber: string;
    startTime: string;
    endTime: string;
    court: string;
    bookerName: string;
    bookerWa: string;
    status: string;
    duration: number;
    lockedUntil: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  async function load() {
    const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
    if (res.ok) setData(await res.json());
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // near real-time polling
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of today's activity." />

      {data && data.pendingCount > 0 && (
        <Link
          href="/admin/bookings?status=PENDING"
          className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-800"
        >
          <span className="font-medium">
            ⏳ {data.pendingCount} pending booking{data.pendingCount > 1 ? "s" : ""} awaiting confirmation
          </span>
          <span className="text-sm underline">Review →</span>
        </Link>
      )}

      {data && data.expiringMembers > 0 && (
        <Link
          href="/admin/members?filter=expiring"
          className="mb-5 flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-800"
        >
          <span className="font-medium">
            ⚠️ {data.expiringMembers} member{data.expiringMembers > 1 ? "s" : ""} expiring within 7 days
          </span>
          <span className="text-sm underline">Review →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's bookings" value={data?.todayCount ?? "—"} />
        <StatCard label="Pending" value={data?.pendingCount ?? "—"} alert={!!data && data.pendingCount > 0} />
        <StatCard label="Available slots today" value={data?.availableToday ?? "—"} />
        <StatCard label="Revenue (7d est.)" value={data ? formatCurrency(data.revenueWeek) : "—"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Active Members" value={data?.activeMembers ?? "—"} />
        <StatCard label="Expiring (7 days)" value={data?.expiringMembers ?? "—"} alert={!!data && data.expiringMembers > 0} />
      </div>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Today&apos;s bookings</h2>
        {!data ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : data.todays.length === 0 ? (
          <p className="py-8 text-center text-ink/40">No bookings today yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase text-ink/40">
                <tr>
                  <th className="py-2">Time</th>
                  <th className="py-2">Court</th>
                  <th className="py-2">Booker</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Lock</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.todays.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5">{b.startTime}–{b.endTime}</td>
                    <td className="py-2.5">{b.court}</td>
                    <td className="py-2.5">
                      <div className="font-medium text-ink">{b.bookerName}</div>
                      <div className="text-xs text-ink/40">{b.bookerWa}</div>
                    </td>
                    <td className="py-2.5"><StatusBadge status={b.status} /></td>
                    <td className="py-2.5">
                      {b.status === "PENDING" ? <Countdown until={b.lockedUntil} /> : "—"}
                    </td>
                    <td className="py-2.5 text-right">
                      <a
                        href={simpleWaLink(b.bookerWa, `Halo ${b.bookerName}! Ini tim Vista Padel (Ref: ${b.refNumber}).`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

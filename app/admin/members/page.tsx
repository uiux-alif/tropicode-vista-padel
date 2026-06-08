"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Card, StatCard } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/admin/Modal";
import { MemberDrawer, type AdminMember } from "@/components/admin/MemberDrawer";
import { formatCurrency, formatDateEn, toDateKey } from "@/lib/utils";
import { memberConfirmationLink } from "@/lib/whatsapp";

const STATUSES = ["ALL", "ACTIVE", "EXPIRED", "PAUSED", "CANCELLED"];

const STATUS_VARIANT: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green",
  PAUSED: "amber",
  EXPIRED: "red",
  CANCELLED: "gray",
};

interface Plan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  exp.setHours(0, 0, 0, 0);
  return Math.round((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function calcExpiryDisplay(expiresAt: string): React.ReactNode {
  const key = toDateKey(new Date(expiresAt));
  const days = daysUntil(expiresAt);
  const label = formatDateEn(key);
  if (days < 0) return <span className="text-red-600 font-medium">{label}</span>;
  if (days <= 7) return <span className="text-amber-600 font-medium">{label}</span>;
  return <span className="text-ink/70">{label}</span>;
}

function calcExpiry(startDate: string, billingPeriod: string): string {
  const d = new Date(startDate);
  const bp = billingPeriod.toLowerCase();
  if (bp === "monthly") d.setMonth(d.getMonth() + 1);
  else if (bp === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (bp === "annual") d.setMonth(d.getMonth() + 12);
  else d.setMonth(d.getMonth() + 1);
  return toDateKey(d);
}

interface AddSuccessData {
  member: AdminMember;
  waLink: string;
}

function MembersInner() {
  const params = useSearchParams();

  const [members, setMembers] = useState<AdminMember[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [expiringSoon, setExpiringSoon] = useState(params.get("filter") === "expiring");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminMember | null>(null);
  const [openDrawerToRenew, setOpenDrawerToRenew] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState<AddSuccessData | null>(null);

  // Stats
  const [stats, setStats] = useState({ active: 0, expiring: 0, expired: 0, total: 0 });

  // Add form state
  const today = toDateKey(new Date());
  const [form, setForm] = useState({
    name: "",
    waNumber: "",
    email: "",
    planId: "",
    startDate: today,
    billingPeriod: "Monthly",
    paidAmount: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== "ALL") qs.set("status", status);
    if (search) qs.set("search", search);
    if (expiringSoon) qs.set("expiringSoon", "true");
    const res = await fetch(`/api/admin/members?${qs.toString()}`, { cache: "no-store" });
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, [status, search, expiringSoon]);

  const loadStats = useCallback(async () => {
    const [allRes, expiringRes] = await Promise.all([
      fetch("/api/admin/members", { cache: "no-store" }),
      fetch("/api/admin/members?expiringSoon=true", { cache: "no-store" }),
    ]);
    if (allRes.ok) {
      const all: AdminMember[] = await allRes.json();
      setStats({
        active: all.filter((m) => m.status === "ACTIVE").length,
        expired: all.filter((m) => m.status === "EXPIRED").length,
        total: all.length,
        expiring: 0,
      });
    }
    if (expiringRes.ok) {
      const expiring: AdminMember[] = await expiringRes.json();
      setStats((s) => ({ ...s, expiring: expiring.length }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadStats();
    fetch("/api/admin/membership", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((p: Plan[]) => setPlans(p))
      .catch(() => { });
  }, [loadStats]);

  // When selected member changes, reset the openDrawerToRenew flag if no member
  useEffect(() => {
    if (!selected) setOpenDrawerToRenew(false);
  }, [selected]);

  // Update billing period + paid amount when plan changes
  function handlePlanChange(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    setForm((f) => ({
      ...f,
      planId,
      billingPeriod: plan?.billingPeriod ?? f.billingPeriod,
      paidAmount: plan ? String(plan.price) : f.paidAmount,
    }));
  }

  function closeAddModal() {
    setAddOpen(false);
    setAddError("");
    setAddSuccess(null);
    setForm({
      name: "",
      waNumber: "",
      email: "",
      planId: "",
      startDate: today,
      billingPeriod: "Monthly",
      paidAmount: "",
      notes: "",
    });
  }

  async function handleAdd() {
    if (!form.name || !form.waNumber || !form.planId || !form.startDate || !form.paidAmount) {
      setAddError("Please fill all required fields.");
      return;
    }
    setAddBusy(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          waNumber: form.waNumber,
          email: form.email || null,
          planId: form.planId,
          startDate: form.startDate,
          billingPeriod: form.billingPeriod,
          paidAmount: Number(form.paidAmount),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create member.");
      }
      const created: AdminMember = await res.json();
      load();
      loadStats();

      // Build WA link but show it as opt-in instead of auto-opening
      const plan = plans.find((p) => p.id === created.planId);
      const waLink = memberConfirmationLink(created.waNumber, {
        refNumber: created.refNumber,
        name: created.name,
        planName: plan?.name ?? created.plan?.name ?? "",
        billingPeriod: created.billingPeriod,
        startDate: formatDateEn(toDateKey(new Date(created.startDate))),
        expiresAt: formatDateEn(toDateKey(new Date(created.expiresAt))),
        clubName: "Vista Padel Club",
      });
      setAddSuccess({ member: created, waLink });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAddBusy(false);
    }
  }

  const expiryPreview =
    form.startDate && form.billingPeriod
      ? formatDateEn(calcExpiry(form.startDate, form.billingPeriod))
      : "—";

  return (
    <>
      <PageHeader
        title="Members"
        description="Track and manage club memberships."
        action={
          <button onClick={() => setAddOpen(true)} className="btn-primary">
            + Add Member
          </button>
        }
      />

      {/* Stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Members" value={stats.active} />
        <StatCard
          label="Expiring this week"
          value={stats.expiring}
          alert={stats.expiring > 0}
        />
        <StatCard label="Expired" value={stats.expired} />
        <StatCard label="Total Members" value={stats.total} />
      </div>

      {stats.expiring > 0 && (
        <button
          onClick={() => setExpiringSoon(true)}
          className="mb-4 flex w-full items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-5 py-3 text-left text-amber-800 transition hover:bg-amber-100"
        >
          <span className="font-medium">
            ⚠️ {stats.expiring} member{stats.expiring > 1 ? "s" : ""} expiring within 7 days
          </span>
          <span className="text-sm underline">Filter →</span>
        </button>
      )}

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setExpiringSoon(false); }}
            className="input max-w-[160px]"
            aria-label="Filter by status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <button
            onClick={() => setExpiringSoon((v) => !v)}
            className={
              expiringSoon
                ? "btn-primary px-4 py-2 text-sm"
                : "btn-outline px-4 py-2 text-sm"
            }
            aria-pressed={expiringSoon}
          >
            ⏰ Expiring soon
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name / WA / ref…"
            className="input min-w-[180px] flex-1"
            aria-label="Search members"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : members.length === 0 ? (
          <p className="py-16 text-center text-ink/40">No members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase text-ink/40">
                <tr>
                  <th className="py-2 pr-4">Ref</th>
                  <th className="py-2 pr-4">Name / WA</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Start</th>
                  <th className="py-2 pr-4">Expires</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => { setSelected(m); setOpenDrawerToRenew(false); }}
                    className="cursor-pointer transition hover:bg-brand-mint/30"
                  >
                    <td className="py-3 pr-4 font-mono text-xs text-ink/60">{m.refNumber}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-ink">{m.name}</div>
                      <div className="text-xs text-ink/40">{m.waNumber}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant="default">{m.plan?.name ?? "—"}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={STATUS_VARIANT[m.status] ?? "gray"}>{m.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-ink/70">
                      {formatDateEn(toDateKey(new Date(m.startDate)))}
                    </td>
                    <td className="py-3 pr-4">{calcExpiryDisplay(m.expiresAt)}</td>
                    <td className="py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(m);
                            setOpenDrawerToRenew(true);
                          }}
                          className="btn-ghost px-2 py-1 text-xs"
                          aria-label={`Renew ${m.name}`}
                        >
                          🔄 Renew
                        </button>
                        <a
                          href={`https://wa.me/${m.waNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost px-2 py-1 text-xs text-emerald-600"
                          aria-label={`WhatsApp ${m.name}`}
                        >
                          💬 WA
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Member Drawer */}
      {selected && (
        <MemberDrawer
          member={selected}
          onClose={() => { setSelected(null); setOpenDrawerToRenew(false); }}
          onChanged={() => { load(); loadStats(); }}
          openRenew={openDrawerToRenew}
        />
      )}

      {/* Add Member Modal */}
      {addOpen && (
        <Modal
          title="Add Member"
          onClose={closeAddModal}
          footer={
            addSuccess ? (
              <div className="flex gap-3">
                <a
                  href={addSuccess.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 text-center"
                >
                  💬 Send WhatsApp Confirmation
                </a>
                <button onClick={closeAddModal} className="btn-outline flex-1">
                  Done
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={closeAddModal}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={addBusy}
                  className="btn-primary flex-1"
                >
                  {addBusy ? "Saving…" : "Save Member"}
                </button>
              </div>
            )
          }
        >
          {addSuccess ? (
            /* Success state — show confirmation instead of form */
            <div className="space-y-4 text-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">✅</div>
              <div className="text-center">
                <p className="font-semibold text-ink">{addSuccess.member.name}</p>
                <p className="font-mono text-sm text-brand">{addSuccess.member.refNumber}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ink/50">Plan</span>
                  <span className="font-medium text-ink">{addSuccess.member.plan?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink/50">Expires</span>
                  <span className="font-medium text-ink">
                    {formatDateEn(toDateKey(new Date(addSuccess.member.expiresAt)))}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink/50">WhatsApp</span>
                  <span className="font-medium text-ink">{addSuccess.member.waNumber}</span>
                </div>
              </div>
              <p className="text-center text-sm text-ink/60">
                Member created successfully. Send them a WhatsApp confirmation now?
              </p>
            </div>
          ) : (
            /* Add form */
            <div className="space-y-4 text-sm">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Member name"
                />
              </div>
              <div>
                <label className="label">WhatsApp Number *</label>
                <input
                  type="tel"
                  className="input"
                  value={form.waNumber}
                  onChange={(e) => setForm({ ...form, waNumber: e.target.value })}
                  placeholder="08xxx"
                />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="label">Plan *</label>
                <select
                  className="input"
                  value={form.planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)} / {p.billingPeriod}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    className="input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Billing Period</label>
                  <select
                    className="input"
                    value={form.billingPeriod}
                    onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Paid Amount (IDR) *</label>
                <input
                  type="number"
                  className="input"
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  min={0}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any notes…"
                />
              </div>
              {form.startDate && form.billingPeriod && (
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">
                    📅 Membership valid until: <strong>{expiryPreview}</strong>
                  </p>
                </div>
              )}
              {addError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{addError}</p>
              )}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export default function MembersPage() {
  return (
    <Suspense fallback={<p className="py-10 text-center text-ink/40">Loading…</p>}>
      <MembersInner />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { TagInput } from "@/components/admin/TagInput";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  description: string | null;
  features: string[];
  discountPercent: number;
  isFeatured: boolean;
  ctaLabel: string;
  ctaWaMessage: string | null;
  isActive: boolean;
  sortOrder: number;
}

const empty = (): Partial<Plan> => ({
  name: "", price: 0, billingPeriod: "Monthly", description: "", features: [],
  discountPercent: 0, isFeatured: false, ctaLabel: "Get Started",
  ctaWaMessage: "", isActive: true, sortOrder: 0,
});

export default function MembershipPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Partial<Plan> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/membership", { cache: "no-store" });
    if (res.ok) setPlans(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? "/api/admin/membership" : `/api/admin/membership/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setSaveError(j.error ?? "Failed to save. Please try again.");
        return;
      }
      setEditing(null);
      load();
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Plan) {
    if (!confirm(`Delete ${p.name}?`)) return;
    await fetch(`/api/admin/membership/${p.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <PageHeader
        title="Membership Plans"
        description="Plans shown on the membership page."
        action={<button onClick={() => setEditing(empty())} className="btn-primary">+ Add Plan</button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className={p.isFeatured ? "ring-2 ring-brand" : ""}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">{p.name}</h3>
              {p.isFeatured && <Badge variant="accent">Featured</Badge>}
              {!p.isActive && <Badge variant="gray">Inactive</Badge>}
            </div>
            <p className="mt-1 text-2xl font-bold text-brand">{p.price === 0 ? "Free" : formatCurrency(p.price)}</p>
            <p className="text-xs text-ink/40">{p.billingPeriod}</p>
            {p.discountPercent > 0 && (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {p.discountPercent}% off courts
              </span>
            )}
            <ul className="mt-3 space-y-1 text-sm text-ink/60">
              {p.features.map((f, i) => <li key={i}>✓ {f}</li>)}
            </ul>
            <div className="mt-4 flex gap-2 text-sm">
              <button onClick={() => setEditing({ ...p, description: p.description ?? "", ctaWaMessage: p.ctaWaMessage ?? "" })} className="btn-outline px-3 py-1.5">Edit</button>
              <button onClick={() => remove(p)} className="btn-ghost px-3 py-1.5 !text-red-600">Delete</button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit Plan" : "Add Plan"}
          onClose={() => { setEditing(null); setSaveError(""); }}
          footer={
            <div className="space-y-2">
              {saveError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => { setEditing(null); setSaveError(""); }} className="btn-ghost">Cancel</button>
                <button onClick={save} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            <Field label="Name"><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (IDR)"><input type="number" className="input" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
              <Field label="Billing">
                <select className="input" value={editing.billingPeriod} onChange={(e) => setEditing({ ...editing, billingPeriod: e.target.value })}>
                  <option>Monthly</option><option>Quarterly</option><option>Annual</option>
                </select>
              </Field>
            </div>
            <Field label="Discount % on court fees">
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={50} step={5}
                  value={editing.discountPercent ?? 0}
                  onChange={(e) => setEditing({ ...editing, discountPercent: Number(e.target.value) })}
                  className="flex-1 accent-brand" />
                <span className="w-10 text-right font-semibold text-brand">
                  {editing.discountPercent ?? 0}%
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/40">Applied automatically when member books a court.</p>
            </Field>
            <Field label="Description"><input className="input" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Features"><TagInput value={editing.features ?? []} onChange={(features) => setEditing({ ...editing, features })} placeholder="Add a feature, press Enter" /></Field>
            <Field label="CTA label"><input className="input" value={editing.ctaLabel ?? ""} onChange={(e) => setEditing({ ...editing, ctaLabel: e.target.value })} /></Field>
            <Field label="CTA WhatsApp message"><textarea rows={2} className="input" value={editing.ctaWaMessage ?? ""} onChange={(e) => setEditing({ ...editing, ctaWaMessage: e.target.value })} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isFeatured ?? false} onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })} /> Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

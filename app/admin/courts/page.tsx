"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { TagInput } from "@/components/admin/TagInput";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

interface Court {
  id: string;
  name: string;
  type: string;
  surface: string;
  lighting: string;
  capacity: number;
  badge: string | null;
  features: string[];
  photoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  pricing: { priceNormal: number; pricePeak: number } | null;
}

const COURT_TYPES = ["Indoor Premium", "Indoor Standard", "Semi-Indoor", "Indoor VIP", "Outdoor"];

const emptyCourt = (): Partial<Court> & { priceNormal: number; pricePeak: number } => ({
  name: "", type: COURT_TYPES[0], surface: "", lighting: "", capacity: 4,
  badge: "", features: [], isActive: true, sortOrder: 0, priceNormal: 0, pricePeak: 0,
});

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [editing, setEditing] = useState<(Partial<Court> & { priceNormal: number; pricePeak: number }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/courts", { cache: "no-store" });
    if (res.ok) setCourts(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openEdit(c: Court) {
    setEditing({ ...c, badge: c.badge ?? "", priceNormal: c.pricing?.priceNormal ?? 0, pricePeak: c.pricing?.pricePeak ?? 0 });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? "/api/admin/courts" : `/api/admin/courts/${editing.id}`, {
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

  async function toggleActive(c: Court) {
    await fetch(`/api/admin/courts/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, isActive: !c.isActive, priceNormal: c.pricing?.priceNormal, pricePeak: c.pricing?.pricePeak }),
    });
    load();
  }

  async function remove(c: Court) {
    if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
    await fetch(`/api/admin/courts/${c.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <PageHeader
        title="Courts"
        description="Manage courts shown on the schedule and facilities pages."
        action={<button onClick={() => setEditing(emptyCourt())} className="btn-primary">+ Add Court</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {courts.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-ink">{c.name}</h3>
                  {c.badge && <Badge variant="accent">{c.badge}</Badge>}
                  {!c.isActive && <Badge variant="gray">Inactive</Badge>}
                </div>
                <p className="text-sm text-ink/50">{c.type}</p>
              </div>
              <span className="text-sm font-medium text-brand">
                {formatCurrency(c.pricing?.priceNormal ?? 0)}
              </span>
            </div>
            <p className="mt-2 text-xs text-ink/40">{c.surface} · {c.lighting} · {c.capacity} players</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.features.map((f) => <span key={f} className="badge bg-gray-100 text-ink/60">{f}</span>)}
            </div>
            <div className="mt-4 flex gap-2 text-sm">
              <button onClick={() => openEdit(c)} className="btn-outline px-3 py-1.5">Edit</button>
              <button onClick={() => toggleActive(c)} className="btn-ghost px-3 py-1.5">{c.isActive ? "Deactivate" : "Activate"}</button>
              <button onClick={() => remove(c)} className="btn-ghost px-3 py-1.5 !text-red-600">Delete</button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit Court" : "Add Court"}
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
            <Field label="Type">
              <select className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {COURT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Surface"><input className="input" value={editing.surface ?? ""} onChange={(e) => setEditing({ ...editing, surface: e.target.value })} /></Field>
              <Field label="Lighting"><input className="input" value={editing.lighting ?? ""} onChange={(e) => setEditing({ ...editing, lighting: e.target.value })} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Capacity"><input type="number" className="input" value={editing.capacity ?? 4} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} /></Field>
              <Field label="Normal/hr"><input type="number" className="input" value={editing.priceNormal} onChange={(e) => setEditing({ ...editing, priceNormal: Number(e.target.value) })} /></Field>
              <Field label="Peak/hr"><input type="number" className="input" value={editing.pricePeak} onChange={(e) => setEditing({ ...editing, pricePeak: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Badge (optional)"><input className="input" value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="e.g. Most Popular" /></Field>
            <Field label="Photo URL (optional)"><input className="input" value={editing.photoUrl ?? ""} onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })} /></Field>
            <Field label="Features"><TagInput value={editing.features ?? []} onChange={(features) => setEditing({ ...editing, features })} /></Field>
            <Field label="Sort order"><input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

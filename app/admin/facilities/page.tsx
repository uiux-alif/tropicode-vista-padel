"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { Badge } from "@/components/ui/Badge";

interface Facility {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

const empty = (): Partial<Facility> => ({ name: "", description: "", icon: "🎾", isActive: true, sortOrder: 0 });

export default function FacilitiesPage() {
  const [items, setItems] = useState<Facility[]>([]);
  const [editing, setEditing] = useState<Partial<Facility> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/facilities", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? "/api/admin/facilities" : `/api/admin/facilities/${editing.id}`, {
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

  async function remove(f: Facility) {
    if (!confirm(`Delete ${f.name}?`)) return;
    await fetch(`/api/admin/facilities/${f.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <PageHeader
        title="Facilities"
        description="Amenities shown on the home and facilities pages."
        action={<button onClick={() => setEditing(empty())} className="btn-primary">+ Add Facility</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <Card key={f.id}>
            <div className="flex items-start justify-between">
              <span className="text-3xl">{f.icon}</span>
              {!f.isActive && <Badge variant="gray">Inactive</Badge>}
            </div>
            <h3 className="mt-2 font-semibold text-ink">{f.name}</h3>
            <p className="mt-1 text-sm text-ink/60">{f.description}</p>
            <div className="mt-3 flex gap-2 text-sm">
              <button onClick={() => setEditing(f)} className="btn-outline px-3 py-1.5">Edit</button>
              <button onClick={() => remove(f)} className="btn-ghost px-3 py-1.5 !text-red-600">Delete</button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit Facility" : "Add Facility"}
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
            <div><label className="label">Icon (emoji)</label><input className="input" value={editing.icon ?? ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} /></div>
            <div><label className="label">Name</label><input className="input" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea rows={3} className="input" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className="label">Sort order</label><input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
          </div>
        </Modal>
      )}
    </>
  );
}

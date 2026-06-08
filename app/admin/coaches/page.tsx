"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { TagInput } from "@/components/admin/TagInput";
import { Badge } from "@/components/ui/Badge";

interface Program { name: string; duration: string; price: number; level: string }
interface Coach {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  certifications: string[];
  bio: string | null;
  photoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  programs: Program[];
}

type Editing = Partial<Coach> & { programs: Program[] };

const empty = (): Editing => ({
  name: "", title: "", specialty: "", experience: "", certifications: [],
  bio: "", photoUrl: "", isActive: true, sortOrder: 0, programs: [],
});

const emptyProgram = (): Program => ({ name: "", duration: "60 min", price: 0, level: "All Levels" });

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/coaches", { cache: "no-store" });
    if (res.ok) setCoaches(await res.json());
  }
  useEffect(() => { load(); }, []);

  function openEdit(c: Coach) {
    setEditing({ ...c, bio: c.bio ?? "", photoUrl: c.photoUrl ?? "", programs: c.programs ?? [] });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setSaveError("");
    const isNew = !editing.id;
    try {
      const res = await fetch(isNew ? "/api/admin/coaches" : `/api/admin/coaches/${editing.id}`, {
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

  async function toggleActive(c: Coach) {
    await fetch(`/api/admin/coaches/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    load();
  }

  async function remove(c: Coach) {
    if (!confirm(`Delete ${c.name}?`)) return;
    await fetch(`/api/admin/coaches/${c.id}`, { method: "DELETE" });
    load();
  }

  function updateProgram(i: number, patch: Partial<Program>) {
    if (!editing) return;
    setEditing({ ...editing, programs: editing.programs.map((p, j) => j === i ? { ...p, ...patch } : p) });
  }

  return (
    <>
      <PageHeader
        title="Coaches"
        description="Manage coaches and their programs shown on the coaching page."
        action={<button onClick={() => setEditing(empty())} className="btn-primary">+ Add Coach</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-ink">{c.name}</h3>
                <p className="text-sm text-ink/50">{c.title}</p>
              </div>
              {!c.isActive && <Badge variant="gray">Inactive</Badge>}
            </div>
            <p className="mt-2 text-xs text-ink/40">{c.specialty} · {c.experience}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.certifications.map((cert) => <span key={cert} className="badge bg-brand-mint text-brand">{cert}</span>)}
            </div>
            <p className="mt-3 text-xs text-ink/40">{c.programs.length} program{c.programs.length !== 1 ? "s" : ""}</p>
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
          title={editing.id ? "Edit Coach" : "Add Coach"}
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
              <Field label="Title"><input className="input" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Head Coach" /></Field>
              <Field label="Experience"><input className="input" value={editing.experience ?? ""} onChange={(e) => setEditing({ ...editing, experience: e.target.value })} placeholder="12 Years" /></Field>
            </div>
            <Field label="Specialty"><input className="input" value={editing.specialty ?? ""} onChange={(e) => setEditing({ ...editing, specialty: e.target.value })} /></Field>
            <Field label="Certifications"><TagInput value={editing.certifications ?? []} onChange={(certifications) => setEditing({ ...editing, certifications })} /></Field>
            <Field label="Bio"><textarea rows={3} className="input" value={editing.bio ?? ""} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} /></Field>
            <Field label="Photo URL (optional)"><input className="input" value={editing.photoUrl ?? ""} onChange={(e) => setEditing({ ...editing, photoUrl: e.target.value })} /></Field>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="label mb-0">Programs</label>
                <button type="button" onClick={() => setEditing({ ...editing, programs: [...editing.programs, emptyProgram()] })} className="text-xs font-medium text-brand hover:underline">+ Add program</button>
              </div>
              <div className="space-y-2">
                {editing.programs.map((p, i) => (
                  <div key={i} className="rounded-xl border border-black/10 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input" placeholder="Program name" value={p.name} onChange={(e) => updateProgram(i, { name: e.target.value })} />
                      <input className="input" placeholder="Duration" value={p.duration} onChange={(e) => updateProgram(i, { duration: e.target.value })} />
                      <input type="number" className="input" placeholder="Price" value={p.price} onChange={(e) => updateProgram(i, { price: Number(e.target.value) })} />
                      <input className="input" placeholder="Level" value={p.level} onChange={(e) => updateProgram(i, { level: e.target.value })} />
                    </div>
                    <button type="button" onClick={() => setEditing({ ...editing, programs: editing.programs.filter((_, j) => j !== i) })} className="mt-2 text-xs text-red-600 hover:underline">Remove</button>
                  </div>
                ))}
                {editing.programs.length === 0 && <p className="text-xs text-ink/40">No programs yet.</p>}
              </div>
            </div>

            <Field label="Sort order"><input type="number" className="input" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.isActive ?? true} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Active</label>
          </div>
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

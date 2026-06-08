"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";

interface Settings {
  "booking.lockMinutes": string;
  "booking.extendMinutes": string;
  "booking.timezone": string;
  "booking.expiryNotify": string;
  "site.maintenanceMode": string;
  "settings.paymentTemplate": string;
  [key: string]: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [paymentTemplate, setPaymentTemplate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lockError, setLockError] = useState("");

  async function load() {
    const [s, c] = await Promise.all([
      fetch("/api/admin/settings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/content", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setSettings(s);
    setPaymentTemplate(c["settings.paymentTemplate"] ?? "");
  }
  useEffect(() => { load(); }, []);

  function set(key: string, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    if (key === "booking.lockMinutes") setLockError("");
  }

  async function save() {
    if (!settings) return;
    // Validate lockMinutes
    const lockMins = parseInt(settings["booking.lockMinutes"], 10);
    if (isNaN(lockMins) || lockMins < 15 || lockMins > 480) {
      setLockError("Lock duration must be between 15 and 480 minutes.");
      return;
    }
    setLockError("");
    setSaving(true);
    await Promise.all([
      fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      }),
      fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "settings.paymentTemplate": paymentTemplate }),
      }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Booking behaviour, timezone, and payment instructions."
        action={<button onClick={save} disabled={saving || !settings} className="btn-primary">{saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}</button>}
      />

      {!settings ? (
        <p className="py-10 text-center text-ink/40">Loading…</p>
      ) : (
        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold text-ink">Booking lock</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Lock duration (minutes)">
                <input type="number" className="input" value={settings["booking.lockMinutes"]} onChange={(e) => set("booking.lockMinutes", e.target.value)} />
                <p className="mt-1 text-xs text-ink/40">Minimum 15 min, maximum 480 min (8 hours)</p>
                {lockError && <p className="mt-1 text-xs text-red-600">{lockError}</p>}
              </Field>
              <Field label="Extend-lock amount (minutes)">
                <input type="number" className="input" value={settings["booking.extendMinutes"]} onChange={(e) => set("booking.extendMinutes", e.target.value)} />
              </Field>
              <Field label="Timezone">
                <input className="input" value={settings["booking.timezone"]} onChange={(e) => set("booking.timezone", e.target.value)} />
              </Field>
              <label className="mt-7 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings["booking.expiryNotify"] === "true"} onChange={(e) => set("booking.expiryNotify", String(e.target.checked))} />
                Notify booker on expiry (WhatsApp)
              </label>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">Payment instructions</h2>
            <p className="mb-2 text-sm text-ink/50">Inserted into the WhatsApp message admins send to bookers.</p>
            <textarea rows={4} className="input font-mono" value={paymentTemplate} onChange={(e) => setPaymentTemplate(e.target.value)} />
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-ink">Site</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings["site.maintenanceMode"] === "true"} onChange={(e) => set("site.maintenanceMode", String(e.target.checked))} />
              Maintenance mode (show &quot;temporarily unavailable&quot; on public site)
            </label>
          </Card>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

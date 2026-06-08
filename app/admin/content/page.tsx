"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";

type ContentMap = Record<string, string>;

// Friendly labels + grouping for the known content keys.
const GROUPS: { title: string; keys: string[] }[] = [
  {
    title: "Global",
    keys: [
      "global.businessName", "global.tagline", "global.whatsapp", "global.email",
      "global.phone", "global.address", "global.instagram", "global.facebook", "global.mapEmbed",
    ],
  },
  { title: "Opening Hours", keys: ["hours.weekday", "hours.weekend"] },
  {
    title: "Home — Hero",
    keys: [
      "home.hero.headline", "home.hero.subheadline", "home.hero.cta1.label",
      "home.hero.cta1.link", "home.hero.cta2.label", "home.hero.cta2.link", "home.hero.bgImage",
    ],
  },
  {
    title: "Home — Sections",
    keys: [
      "home.courts.heading", "home.courts.subheading", "home.coaching.heading", "home.coaching.subheading",
      "home.facilities.heading", "home.facilities.subheading", "home.membership.heading",
      "home.membership.subheading", "home.membership.cta1.label", "home.membership.cta2.label",
    ],
  },
  { title: "Schedule Header", keys: ["schedule.heading", "schedule.subheading"] },
  {
    title: "Coaching",
    keys: [
      "coaching.hero.heading", "coaching.hero.subheading", "coaching.group.heading",
      "coaching.group.subheading", "coaching.group.items", "coaching.cta.heading",
      "coaching.cta.subheading", "coaching.cta.button",
    ],
  },
  {
    title: "Facilities",
    keys: [
      "facilities.hero.heading", "facilities.hero.subheading", "facilities.cafe.heading",
      "facilities.cafe.body", "facilities.cafe.items", "facilities.proshop.heading",
      "facilities.proshop.body", "facilities.proshop.cards",
    ],
  },
  {
    title: "Membership",
    keys: ["membership.hero.heading", "membership.hero.subheading", "membership.benefits", "membership.faq"],
  },
];

function isJsonKey(key: string) {
  return key.endsWith(".items") || key.endsWith(".cards") || key === "membership.benefits" || key === "membership.faq";
}
function isLongKey(key: string) {
  return key.endsWith(".body") || key.endsWith(".subheadline") || key === "global.mapEmbed" || key === "global.address";
}

export default function ContentPage() {
  const [content, setContent] = useState<ContentMap | null>(null);
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/content", { cache: "no-store" });
    if (res.ok) setContent(await res.json());
  }
  useEffect(() => { load(); }, []);

  function set(key: string, value: string) {
    if (!content) return;
    setContent({ ...content, [key]: value });
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    const payload: ContentMap = {};
    for (const g of GROUPS) for (const k of g.keys) if (content[k] !== undefined) payload[k] = content[k];
    await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const group = useMemo(() => GROUPS[active], [active]);

  return (
    <>
      <PageHeader
        title="Site Content"
        description="Edit all CMS-managed text shown across the public website."
        action={<button onClick={save} disabled={saving || !content} className="btn-primary">{saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}</button>}
      />

      {!content ? (
        <p className="py-10 text-center text-ink/40">Loading…</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {GROUPS.map((g, i) => (
              <button
                key={g.title}
                onClick={() => setActive(i)}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-left text-sm transition ${i === active ? "bg-brand text-white" : "text-ink/60 hover:bg-brand-mint"}`}
              >
                {g.title}
              </button>
            ))}
          </nav>

          <Card>
            <h2 className="mb-4 font-semibold text-ink">{group.title}</h2>
            <div className="space-y-4">
              {group.keys.map((key) => (
                <div key={key}>
                  <label className="label font-mono text-xs">{key}</label>
                  {isJsonKey(key) ? (
                    <JsonField value={content[key] ?? ""} onChange={(v) => set(key, v)} />
                  ) : isLongKey(key) ? (
                    <textarea rows={3} className="input" value={content[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
                  ) : (
                    <input className="input" value={content[key] ?? ""} onChange={(e) => set(key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function JsonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [err, setErr] = useState(false);
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    /* keep raw */
  }
  const [draft, setDraft] = useState(pretty);

  return (
    <>
      <textarea
        rows={6}
        className={`input font-mono text-xs ${err ? "!border-red-400" : ""}`}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          try {
            JSON.parse(e.target.value);
            setErr(false);
            onChange(JSON.stringify(JSON.parse(e.target.value)));
          } catch {
            setErr(true);
          }
        }}
      />
      {err && <p className="mt-1 text-xs text-red-600">Invalid JSON — changes won&apos;t save until fixed.</p>}
    </>
  );
}

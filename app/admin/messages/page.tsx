"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/admin/ui";
import { Modal } from "@/components/admin/Modal";
import { Badge } from "@/components/ui/Badge";
import { simpleWaLink } from "@/lib/whatsapp";

interface Message {
  id: string;
  name: string;
  email: string;
  waNumber: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Message | null>(null);
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/messages", { cache: "no-store" });
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function openMsg(m: Message) {
    setOpen(m);
    if (!m.isRead) {
      await fetch(`/api/admin/messages/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      load();
    }
  }

  async function archive(m: Message) {
    await fetch(`/api/admin/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
    setOpen(null);
    load();
  }

  async function unarchive(m: Message) {
    await fetch(`/api/admin/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: false }),
    });
    setOpen(null);
    load();
  }

  async function remove(m: Message) {
    if (!confirm("Delete this message permanently?")) return;
    await fetch(`/api/admin/messages/${m.id}`, { method: "DELETE" });
    setOpen(null);
    load();
  }

  const inbox = messages.filter((m) => !m.isArchived);
  const archived = messages.filter((m) => m.isArchived);
  const unread = inbox.filter((m) => !m.isRead).length;
  const visible = tab === "inbox" ? inbox : archived;

  return (
    <>
      <PageHeader
        title="Messages"
        description="Contact form submissions from the public site."
      />

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("inbox")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "inbox" ? "bg-brand text-white" : "text-ink/60 hover:bg-brand-mint"
            }`}
        >
          Inbox
          {unread > 0 && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
              {unread}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("archived")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === "archived" ? "bg-brand text-white" : "text-ink/60 hover:bg-brand-mint"
            }`}
        >
          Archived {archived.length > 0 && `(${archived.length})`}
        </button>
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-ink/40">
            {tab === "inbox" ? "No messages." : "No archived messages."}
          </p>
        ) : (
          <div className="divide-y divide-black/5">
            {visible.map((m) => (
              <button
                key={m.id}
                onClick={() => openMsg(m)}
                className="flex w-full items-start gap-3 py-3.5 text-left transition hover:bg-brand-mint/20"
              >
                {/* Unread dot */}
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full transition ${m.isRead ? "bg-transparent" : "bg-brand-accent"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-ink ${!m.isRead ? "font-semibold" : ""}`}>
                      {m.name}
                    </span>
                    <Badge variant="outline">{m.subject}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-ink/50">{m.message}</p>
                </div>
                <span className="ml-2 shrink-0 text-xs text-ink/40">
                  {new Date(m.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {open && (
        <Modal
          title={open.subject}
          onClose={() => setOpen(null)}
          footer={
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => remove(open)} className="btn-ghost !text-red-600 px-3 py-1.5 text-sm">
                Delete
              </button>
              <div className="flex gap-2">
                {open.isArchived ? (
                  <button onClick={() => unarchive(open)} className="btn-outline">
                    Move to inbox
                  </button>
                ) : (
                  <button onClick={() => archive(open)} className="btn-outline">
                    Archive
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="font-semibold text-ink">{open.name}</p>
              <p className="text-ink/60">
                <a href={`mailto:${open.email}`} className="hover:text-brand">{open.email}</a>
                {open.waNumber && (
                  <> · <span className="text-ink/60">{open.waNumber}</span></>
                )}
              </p>
              <p className="mt-1 text-xs text-ink/40">
                {new Date(open.createdAt).toLocaleString("en-GB")}
              </p>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-ink/80">{open.message}</p>

            {/* Reply shortcuts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={`mailto:${open.email}?subject=Re: ${encodeURIComponent(open.subject)}`}
                className="btn-outline px-4 py-2 text-xs"
              >
                Reply via Email
              </a>
              {open.waNumber && (
                <a
                  href={simpleWaLink(open.waNumber, `Halo ${open.name}! Terima kasih sudah menghubungi Vista Padel.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary px-4 py-2 text-xs"
                >
                  Reply via WhatsApp
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

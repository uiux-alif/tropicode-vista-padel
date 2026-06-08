"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/guide", label: "Admin Guide", icon: "📖" },
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
  { href: "/admin/schedule", label: "Schedule", icon: "🗓️" },
  { href: "/admin/courts", label: "Courts", icon: "🎾" },
  { href: "/admin/pricing", label: "Pricing", icon: "💰" },
  { href: "/admin/coaches", label: "Coaches", icon: "🧑‍🏫" },
  { href: "/admin/facilities", label: "Facilities", icon: "🏛️" },
  { href: "/admin/membership", label: "Membership", icon: "⭐" },
  { href: "/admin/members", label: "Members", icon: "👥" },
  { href: "/admin/content", label: "Site Content", icon: "📝" },
  { href: "/admin/messages", label: "Messages", icon: "✉️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 lg:hidden">
        <span className="font-bold text-brand">Vista Admin</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" className="rounded-lg p-2 text-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-dark text-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-1 px-6 py-5 text-lg font-bold">
          Vista Padel <span className="h-2 w-2 rounded-full bg-brand-accent" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {LINKS.map((l) => {
            const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"
                )}
              >
                <span>{l.icon}</span> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-xs text-white/50">{email}</p>
          <button onClick={logout} className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20">
            Sign out
          </button>
          <Link href="/" className="mt-2 block text-center text-xs text-white/40 hover:text-brand-accent">
            View site ↗
          </Link>
        </div>
      </aside>

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden" />}
    </>
  );
}

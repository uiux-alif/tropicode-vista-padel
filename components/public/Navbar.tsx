"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/coaching", label: "Coaching" },
  { href: "/facilities", label: "Facilities" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ businessName }: { businessName: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // On non-home pages, always use solid bg; on home page, transparent until scrolled
  const solidBg = scrolled || !isHome;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solidBg
          ? "border-b border-black/5 bg-white/80 shadow-soft backdrop-blur-xl"
          : "bg-transparent"
      )}
    >
      <nav className="container-vp flex h-16 items-center justify-between lg:h-20">
        <Link href="/" className="group flex items-center gap-1.5 text-lg font-bold">
          <span className="font-display tracking-tightest text-brand transition-colors">
            {businessName.replace(/ Club$/, "")}
          </span>
          <span className="h-2 w-2 rounded-full bg-brand-accent transition-transform duration-300 group-hover:scale-125" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-brand-mint text-brand"
                      : "text-ink/70 hover:text-brand"
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <Link href="/schedule" className="btn-accent hidden sm:inline-flex">
            Book a Court →
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-2 text-brand lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? (
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-black/5 bg-white lg:hidden">
          <ul className="container-vp flex flex-col py-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-ink/80 hover:bg-brand-mint"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="px-4 pt-2">
              <Link href="/schedule" className="btn-accent w-full">
                Book a Court →
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

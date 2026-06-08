"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Login failed.");
      }
      router.push(params.get("from") ?? "/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-dark px-4">
      {/* Decorative backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-brand-light" />
      <div className="absolute inset-0 bg-grid-faint [background-size:40px_40px] opacity-[0.07]" />
      <div className="absolute -left-20 top-1/3 h-80 w-80 rounded-full bg-brand-accent/20 blur-[120px]" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/95 p-8 shadow-lift backdrop-blur">
        <div className="mb-6 flex items-center gap-1.5 font-display text-xl font-bold tracking-tightest text-brand">
          Vista Padel <span className="h-2 w-2 rounded-full bg-brand-accent" />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tightest text-ink">Admin sign in</h1>
        <p className="mt-1 text-sm text-ink/50">Manage bookings, content, and more.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder="admin@vistapadel.id" />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input" placeholder="••••••••" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

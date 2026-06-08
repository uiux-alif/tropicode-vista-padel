"use client";

import { useState } from "react";

const SUBJECTS = ["General Inquiry", "Booking", "Coaching", "Membership", "Events", "Other"];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to send message.");
      }
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl">✅</div>
        <h3 className="mt-3 text-lg font-semibold text-ink">Message sent!</h3>
        <p className="mt-2 text-sm text-ink/60">
          Thanks for reaching out. Our team will get back to you shortly.
        </p>
        <button onClick={() => setStatus("idle")} className="btn-outline mt-5">
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name *</label>
          <input id="name" name="name" required className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@email.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="waNumber">WhatsApp</label>
          <input id="waNumber" name="waNumber" className="input" placeholder="08xxxxxxxxxx" />
        </div>
        <div>
          <label className="label" htmlFor="subject">Subject *</label>
          <select id="subject" name="subject" required className="input">
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="message">Message *</label>
        <textarea id="message" name="message" required rows={5} className="input" placeholder="How can we help?" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}

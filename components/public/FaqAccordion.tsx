"use client";

import { useState } from "react";

export function FaqAccordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
      {items.map((item, i) => (
        <div key={i}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="font-medium text-ink">{item.question}</span>
            <span className={`text-brand transition ${open === i ? "rotate-45" : ""}`}>+</span>
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-ink/60">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}

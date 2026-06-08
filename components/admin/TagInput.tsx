"use client";

import { useState } from "react";

export function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  }

  return (
    <div className="rounded-xl border border-black/10 p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span key={tag} className="badge bg-brand-mint text-brand">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} className="ml-1 text-brand/60 hover:text-brand">
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder ?? "Type and press Enter"}
        className="mt-1.5 w-full bg-transparent px-1 py-1 text-sm outline-none"
      />
    </div>
  );
}

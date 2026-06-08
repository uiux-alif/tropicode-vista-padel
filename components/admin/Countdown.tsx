"use client";

import { useEffect, useState } from "react";

export function Countdown({ until }: { until: string | Date }) {
  const target = typeof until === "string" ? new Date(until) : until;
  const [remaining, setRemaining] = useState(() => target.getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => setRemaining(target.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining <= 0) return <span className="text-red-600">Expired</span>;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span className={mins < 10 ? "font-medium text-red-600" : "text-amber-600"}>
      {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}

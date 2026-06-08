import { cn } from "@/lib/utils";
import type { SlotState } from "@/lib/booking";

const STATE_STYLES: Record<SlotState, string> = {
  available: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 cursor-pointer",
  peak: "bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200 cursor-pointer",
  booked: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed",
  locked: "bg-amber-50 text-amber-700 border-amber-200 cursor-not-allowed",
  blocked: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through",
  closed: "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed",
};

const STATE_LABELS: Record<SlotState, string> = {
  available: "Open",
  peak: "Peak",
  booked: "Booked",
  locked: "Pending",
  blocked: "Blocked",
  closed: "—",
};

export function SlotPill({
  time,
  state,
  onClick,
}: {
  time: string;
  state: SlotState;
  onClick?: () => void;
}) {
  const clickable = state === "available" || state === "peak";
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={clickable ? onClick : undefined}
      aria-label={`${time} — ${STATE_LABELS[state]}`}
      className={cn(
        "flex w-full flex-col items-center rounded-lg border px-2 py-1.5 text-xs font-medium transition",
        STATE_STYLES[state]
      )}
    >
      <span>{time}</span>
      <span className="text-[10px] opacity-70">{STATE_LABELS[state]}</span>
    </button>
  );
}

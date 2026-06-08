import { prisma } from "./prisma";
import { dateKeyToUtc, toDateKey, addHours } from "./utils";

export const DEFAULT_TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export type SlotState =
  | "available"
  | "peak"
  | "booked"
  | "locked"
  | "blocked"
  | "closed";

export interface SlotView {
  time: string;
  state: SlotState;
  refNumber?: string;
}

export interface CourtScheduleView {
  courtId: string;
  courtName: string;
  courtType: string;
  badge: string | null;
  priceNormal: number;
  pricePeak: number;
  slots: SlotView[];
}

export interface ScheduleResponse {
  date: string;
  peakStart: number;
  peakEnd: number;
  timeSlots: string[];
  courts: CourtScheduleView[];
}

/** Generate a unique-ish booking reference: VPC-YYYY-NNNN. */
export async function generateRefNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VPC-${year}-`;
  const last = await prisma.booking.findFirst({
    where: { refNumber: { startsWith: prefix } },
    orderBy: { refNumber: "desc" },
    select: { refNumber: true },
  });
  const lastNum = last ? parseInt(last.refNumber.slice(prefix.length), 10) : 0;
  const next = String(lastNum + 1).padStart(4, "0");
  return `${prefix}${next}`;
}

/** A booking occupies its start hour through start+duration. Returns occupied "HH:00" slots. */
export function occupiedSlots(startTime: string, duration: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < duration; i++) out.push(addHours(startTime, i));
  return out;
}

/**
 * Build the full schedule grid for a given date key (YYYY-MM-DD).
 * Pulls active courts, their pricing, active bookings, and slot blocks.
 */
export async function buildSchedule(dateKey: string): Promise<ScheduleResponse> {
  const dateUtc = dateKeyToUtc(dateKey);
  const todayKey = toDateKey(new Date());
  const isToday = dateKey === todayKey;
  const nowHour = new Date().getHours();

  const [courts, globalPricing, bookings, blocks] = await Promise.all([
    prisma.court.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { pricing: true },
    }),
    prisma.globalPricing.findFirst(),
    prisma.booking.findMany({
      where: {
        date: dateUtc,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.slotBlock.findMany({ where: { date: dateUtc } }),
  ]);

  const peakStart = globalPricing?.peakHourStart ?? 17;
  const peakEnd = globalPricing?.peakHourEnd ?? 22;
  const now = new Date();

  const courtsView: CourtScheduleView[] = courts.map((court) => {
    // Map of slot -> state for this court.
    const occupied = new Map<string, { state: SlotState; ref?: string }>();

    for (const b of bookings) {
      if (b.courtId !== court.id) continue;
      const isLocked = b.status === "PENDING" && b.lockedUntil > now;
      // A confirmed booking, or a still-valid pending lock, occupies slots.
      if (b.status === "CONFIRMED" || isLocked) {
        for (const s of occupiedSlots(b.startTime, b.duration)) {
          occupied.set(s, {
            state: b.status === "CONFIRMED" ? "booked" : "locked",
            ref: b.refNumber,
          });
        }
      }
    }

    for (const blk of blocks) {
      if (blk.courtId !== court.id) continue;
      const startH = parseInt(blk.startTime.split(":")[0], 10);
      const endH = parseInt(blk.endTime.split(":")[0], 10);
      for (let h = startH; h < endH; h++) {
        occupied.set(`${String(h).padStart(2, "0")}:00`, { state: "blocked" });
      }
    }

    const slots: SlotView[] = DEFAULT_TIME_SLOTS.map((time) => {
      const hour = parseInt(time.split(":")[0], 10);
      const occ = occupied.get(time);
      if (occ) return { time, state: occ.state, refNumber: occ.ref };
      if (isToday && hour <= nowHour) return { time, state: "closed" };
      const isPeak = hour >= peakStart && hour < peakEnd;
      return { time, state: isPeak ? "peak" : "available" };
    });

    return {
      courtId: court.id,
      courtName: court.name,
      courtType: court.type,
      badge: court.badge,
      priceNormal: court.pricing?.priceNormal ?? 0,
      pricePeak: court.pricing?.pricePeak ?? 0,
      slots,
    };
  });

  return {
    date: dateKey,
    peakStart,
    peakEnd,
    timeSlots: DEFAULT_TIME_SLOTS,
    courts: courtsView,
  };
}

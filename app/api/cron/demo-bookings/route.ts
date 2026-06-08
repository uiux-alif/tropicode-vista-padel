import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_NAMES = [
  "Agung Setiawan", "Bella Putri", "Cahyo Nugroho", "Dinda Pramesti",
  "Erwan Susanto", "Fitri Handayani", "Guntur Wicaksono", "Hani Safitri",
  "Irfan Maulana", "Jasmine Putri", "Kevin Hartono", "Laila Rahma",
  "Mirza Fauzi", "Nadia Kusuma", "Oscar Putra", "Prita Dewi",
  "Rizky Firmansyah", "Sari Widiastuti", "Teguh Prasetyo", "Umar Bakri",
  "Vina Sari", "Wahyu Hidayat", "Yogi Saputra", "Zara Puspita",
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomWa(): string {
  const base = randomBetween(81200000000, 81299999999);
  return `628${base}`;
}

function pickStartHour(): number {
  const r = Math.random();
  if (r < 0.25) return randomBetween(7, 11);
  if (r < 0.55) return randomBetween(12, 16);
  return randomBetween(17, 21);
}

function pickDuration(): number {
  const r = Math.random();
  if (r < 0.60) return 1;
  if (r < 0.90) return 2;
  return 3;
}

function bookingRef(n: number): string {
  return `VPC-DEMO-${String(n).padStart(6, "0")}`;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: Request) {
  // Verify CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Auto-expire yesterday's stale PENDING bookings
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const expireResult = await prisma.booking.updateMany({
      where: {
        status: "PENDING",
        lockedUntil: { lt: new Date() },
        date: { lt: yesterday },
      },
      data: {
        status: "EXPIRED",
        expiredAt: new Date(),
      },
    });

    // 2. Get active courts
    const courts = await prisma.court.findMany({
      where: { isActive: true },
      include: { pricing: true },
    });

    if (courts.length === 0) {
      return NextResponse.json({ added: 0, expired: expireResult.count });
    }

    // 3. Get global pricing
    const globalPricing = await prisma.globalPricing.findFirst();
    const peakStart = globalPricing?.peakHourStart ?? 17;
    const peakEnd = globalPricing?.peakHourEnd ?? 22;

    // 4. Get today's date
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    // 5. Get already-booked slots for today
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { courtId: true, startTime: true, duration: true },
    });

    // Build set of taken slots: "courtId-hour"
    const takenSlots = new Set<string>();
    for (const bk of existingBookings) {
      const startHour = parseInt(bk.startTime.split(":")[0], 10);
      for (let h = 0; h < bk.duration; h++) {
        takenSlots.add(`${bk.courtId}-${startHour + h}`);
      }
    }

    // 6. Generate 3-8 new bookings
    const targetCount = randomBetween(3, 8);
    let added = 0;
    let attempts = 0;

    // Get a unique counter seed based on current booking count
    const existingCount = await prisma.booking.count();
    let refCounter = existingCount + 1;

    while (added < targetCount && attempts < 50) {
      attempts++;
      const court = randomChoice(courts);
      const startHour = pickStartHour();
      const duration = pickDuration();

      // Check if any of the required hours are taken
      let slotFree = true;
      for (let h = 0; h < duration; h++) {
        if (takenSlots.has(`${court.id}-${startHour + h}`)) {
          slotFree = false;
          break;
        }
        if (startHour + duration > 23) {
          slotFree = false;
          break;
        }
      }

      if (!slotFree) continue;

      // Mark slots as taken
      for (let h = 0; h < duration; h++) {
        takenSlots.add(`${court.id}-${startHour + h}`);
      }

      const startTime = `${String(startHour).padStart(2, "0")}:00`;
      const endTime = `${String(startHour + duration).padStart(2, "0")}:00`;
      const refNum = bookingRef(refCounter++);

      const priceNormal = court.pricing?.priceNormal ?? 120000;
      const pricePeak = court.pricing?.pricePeak ?? 180000;

      let estimatedTotal = 0;
      for (let h = 0; h < duration; h++) {
        const hr = startHour + h;
        const isPeak = hr >= peakStart && hr < peakEnd;
        estimatedTotal += isPeak ? pricePeak : priceNormal;
      }

      const lockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // +60 min

      await prisma.booking.create({
        data: {
          refNumber: refNum,
          courtId: court.id,
          date: todayStart,
          startTime,
          duration,
          endTime,
          bookerName: randomChoice(DEMO_NAMES),
          bookerWa: randomWa(),
          players: randomBetween(2, 4),
          addonRacket: false,
          addonBall: false,
          addonCoaching: false,
          notes: "Demo booking",
          estimatedTotal,
          memberRef: null,
          memberDiscount: 0,
          status: "PENDING",
          lockedUntil,
        },
      });

      added++;
    }

    return NextResponse.json({ added, expired: expireResult.count });
  } catch (err) {
    console.error("[demo-bookings cron]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

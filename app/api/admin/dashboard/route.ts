import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { dateKeyToUtc, toDateKey } from "@/lib/utils";
import { DEFAULT_TIME_SLOTS, occupiedSlots } from "@/lib/booking";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const todayKey = toDateKey(new Date());
    const todayUtc = dateKeyToUtc(todayKey);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [todaysBookings, pendingCount, activeCourts, weekConfirmed, expiringMembers, activeMembers] =
      await Promise.all([
        prisma.booking.findMany({
          where: { date: todayUtc, status: { in: ["PENDING", "CONFIRMED"] } },
          include: { court: true },
          orderBy: { startTime: "asc" },
        }),
        prisma.booking.count({ where: { status: "PENDING", lockedUntil: { gt: now } } }),
        prisma.court.count({ where: { isActive: true } }),
        prisma.booking.findMany({
          where: { status: "CONFIRMED", createdAt: { gte: weekAgo } },
          select: { estimatedTotal: true },
        }),
        prisma.member.count({
          where: { status: "ACTIVE", expiresAt: { gte: now, lte: in7Days } },
        }),
        prisma.member.count({ where: { status: "ACTIVE" } }),
      ]);

    // Available slots today across active courts.
    const totalSlotsToday = activeCourts * DEFAULT_TIME_SLOTS.length;
    let occupied = 0;
    for (const b of todaysBookings) occupied += occupiedSlots(b.startTime, b.duration).length;
    const availableToday = Math.max(0, totalSlotsToday - occupied);

    const revenueWeek = weekConfirmed.reduce((s, b) => s + b.estimatedTotal, 0);

    return NextResponse.json({
      todayCount: todaysBookings.length,
      pendingCount,
      availableToday,
      revenueWeek,
      expiringMembers,
      activeMembers,
      todays: todaysBookings.map((b) => ({
        id: b.id,
        refNumber: b.refNumber,
        startTime: b.startTime,
        endTime: b.endTime,
        court: b.court.name,
        bookerName: b.bookerName,
        bookerWa: b.bookerWa,
        status: b.status,
        duration: b.duration,
        lockedUntil: b.lockedUntil,
      })),
    });
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Expires PENDING bookings whose lock has elapsed.
 * Trigger every 5 minutes via Vercel Cron. Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const result = await prisma.booking.updateMany({
      where: { status: "PENDING", lockedUntil: { lt: now } },
      data: { status: "EXPIRED", expiredAt: now },
    });
    return NextResponse.json({ expired: result.count, at: now.toISOString() });
  } catch (err) {
    console.error("expire-bookings error", err);
    return NextResponse.json({ error: "Cron failed." }, { status: 500 });
  }
}

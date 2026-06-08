import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Extend a pending booking's lock by the configured amount (default 30 min). */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending bookings can be extended." }, { status: 409 });
    }

    const extendMinutes = parseInt(await getSetting("booking.extendMinutes"), 10) || 30;
    // Extend from the later of now or the current lock to avoid shortening it.
    const base = existing.lockedUntil > new Date() ? existing.lockedUntil : new Date();
    const lockedUntil = new Date(base.getTime() + extendMinutes * 60 * 1000);

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: { lockedUntil },
      include: { court: true },
    });
    return NextResponse.json(booking);
  });
}

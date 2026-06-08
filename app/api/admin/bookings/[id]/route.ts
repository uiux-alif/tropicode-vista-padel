import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { court: true },
    });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(booking);
  });
}

/**
 * Update a booking. Supports an `action` to drive the status workflow:
 *   confirm | reject | cancel  — plus free-form adminNotes updates.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const b = await req.json();
    const now = new Date();

    const existing = await prisma.booking.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (b.adminNotes !== undefined) data.adminNotes = b.adminNotes;

    switch (b.action) {
      case "confirm":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Only pending bookings can be confirmed." }, { status: 409 });
        }
        data.status = "CONFIRMED";
        data.confirmedAt = now;
        break;
      case "reject":
        if (existing.status !== "PENDING") {
          return NextResponse.json({ error: "Only pending bookings can be rejected." }, { status: 409 });
        }
        data.status = "REJECTED";
        data.rejectedAt = now;
        break;
      case "cancel":
        if (existing.status !== "CONFIRMED") {
          return NextResponse.json({ error: "Only confirmed bookings can be cancelled." }, { status: 409 });
        }
        data.status = "CANCELLED";
        data.cancelledAt = now;
        break;
      case undefined:
        break;
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data,
      include: { court: true },
    });
    return NextResponse.json(booking);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.booking.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}

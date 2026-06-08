import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.name !== undefined) data.name = b.name;
    if (b.type !== undefined) data.type = b.type;
    if (b.surface !== undefined) data.surface = b.surface;
    if (b.lighting !== undefined) data.lighting = b.lighting;
    if (b.capacity !== undefined) data.capacity = Number(b.capacity) || 4;
    if (b.badge !== undefined) data.badge = b.badge || null;
    if (b.features !== undefined) data.features = Array.isArray(b.features) ? b.features : [];
    if (b.photoUrl !== undefined) data.photoUrl = b.photoUrl || null;
    if (b.isActive !== undefined) data.isActive = b.isActive;
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;

    // Upsert pricing when provided.
    if (b.priceNormal !== undefined || b.pricePeak !== undefined) {
      await prisma.courtPricing.upsert({
        where: { courtId: params.id },
        create: {
          courtId: params.id,
          priceNormal: Number(b.priceNormal) || 0,
          pricePeak: Number(b.pricePeak) || 0,
        },
        update: {
          ...(b.priceNormal !== undefined ? { priceNormal: Number(b.priceNormal) || 0 } : {}),
          ...(b.pricePeak !== undefined ? { pricePeak: Number(b.pricePeak) || 0 } : {}),
        },
      });
    }

    const court = await prisma.court.update({
      where: { id: params.id },
      data,
      include: { pricing: true },
    });
    revalidateTag("courts");
    return NextResponse.json(court);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    // Block deletion if the court has bookings; deactivate instead.
    const bookingCount = await prisma.booking.count({ where: { courtId: params.id } });
    if (bookingCount > 0) {
      await prisma.court.update({ where: { id: params.id }, data: { isActive: false } });
      return NextResponse.json({ ok: true, deactivated: true });
    }
    await prisma.court.delete({ where: { id: params.id } });
    revalidateTag("courts");
    return NextResponse.json({ ok: true });
  });
}

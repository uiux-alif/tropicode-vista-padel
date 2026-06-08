import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const courts = await prisma.court.findMany({
      orderBy: { sortOrder: "asc" },
      include: { pricing: true },
    });
    return NextResponse.json(courts);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();
    const court = await prisma.court.create({
      data: {
        name: b.name,
        type: b.type,
        surface: b.surface,
        lighting: b.lighting,
        capacity: Number(b.capacity) || 4,
        badge: b.badge || null,
        features: Array.isArray(b.features) ? b.features : [],
        photoUrl: b.photoUrl || null,
        isActive: b.isActive ?? true,
        sortOrder: Number(b.sortOrder) || 0,
        pricing: {
          create: {
            priceNormal: Number(b.priceNormal) || 0,
            pricePeak: Number(b.pricePeak) || 0,
          },
        },
      },
      include: { pricing: true },
    });
    revalidateTag("courts");
    return NextResponse.json(court, { status: 201 });
  });
}

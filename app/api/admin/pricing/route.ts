import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const [courts, global] = await Promise.all([
      prisma.court.findMany({ orderBy: { sortOrder: "asc" }, include: { pricing: true } }),
      prisma.globalPricing.findFirst(),
    ]);
    return NextResponse.json({
      courts: courts.map((c) => ({
        id: c.id,
        name: c.name,
        priceNormal: c.pricing?.priceNormal ?? 0,
        pricePeak: c.pricing?.pricePeak ?? 0,
      })),
      global: global ?? {
        peakHourStart: 17,
        peakHourEnd: 22,
        racketRental: 30000,
        ballRental: 15000,
        coachingAddon: 200000,
      },
    });
  });
}

export async function PUT(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();

    if (Array.isArray(b.courts)) {
      for (const c of b.courts) {
        await prisma.courtPricing.upsert({
          where: { courtId: c.id },
          create: { courtId: c.id, priceNormal: Number(c.priceNormal) || 0, pricePeak: Number(c.pricePeak) || 0 },
          update: { priceNormal: Number(c.priceNormal) || 0, pricePeak: Number(c.pricePeak) || 0 },
        });
      }
    }

    if (b.global) {
      const existing = await prisma.globalPricing.findFirst();
      const data = {
        peakHourStart: Number(b.global.peakHourStart),
        peakHourEnd: Number(b.global.peakHourEnd),
        racketRental: Number(b.global.racketRental),
        ballRental: Number(b.global.ballRental),
        coachingAddon: Number(b.global.coachingAddon),
      };
      if (existing) {
        await prisma.globalPricing.update({ where: { id: existing.id }, data });
      } else {
        await prisma.globalPricing.create({ data });
      }
    }

    revalidateTag("pricing");
    revalidateTag("courts");
    return NextResponse.json({ ok: true });
  });
}

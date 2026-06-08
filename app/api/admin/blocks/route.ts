import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { dateKeyToUtc } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAdmin(async () => {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const where = date ? { date: dateKeyToUtc(date) } : {};
    const blocks = await prisma.slotBlock.findMany({
      where,
      include: { court: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(blocks);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();
    // Support bulk block across a court + time range for one date.
    const block = await prisma.slotBlock.create({
      data: {
        courtId: b.courtId,
        date: dateKeyToUtc(b.date),
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason || null,
      },
    });
    return NextResponse.json(block, { status: 201 });
  });
}

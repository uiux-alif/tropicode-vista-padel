import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { dateKeyToUtc } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAdmin(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const courtId = searchParams.get("courtId");
    const search = searchParams.get("search");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Prisma.BookingWhereInput = {};
    if (status && status !== "ALL") where.status = status as Prisma.BookingWhereInput["status"];
    if (courtId && courtId !== "ALL") where.courtId = courtId;
    if (from || to) {
      where.date = {};
      if (from) (where.date as Prisma.DateTimeFilter).gte = dateKeyToUtc(from);
      if (to) (where.date as Prisma.DateTimeFilter).lte = dateKeyToUtc(to);
    }
    if (search) {
      where.OR = [
        { bookerName: { contains: search, mode: "insensitive" } },
        { bookerWa: { contains: search } },
        { refNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { court: true },
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      take: 200,
    });

    return NextResponse.json(bookings);
  });
}

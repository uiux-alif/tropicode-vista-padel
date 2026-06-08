import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** Generate next ref number: MBR-YYYY-NNNN */
async function generateRefNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MBR-${year}-`;
  const last = await prisma.member.findFirst({
    where: { refNumber: { startsWith: prefix } },
    orderBy: { refNumber: "desc" },
    select: { refNumber: true },
  });
  let seq = 1;
  if (last) {
    const parts = last.refNumber.split("-");
    seq = (parseInt(parts[2] ?? "0", 10) || 0) + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

/** Calculate expiresAt from startDate + billingPeriod string */
function calcExpiresAt(startDate: Date, billingPeriod: string): Date {
  const d = new Date(startDate);
  const bp = billingPeriod.toLowerCase();
  if (bp === "monthly") d.setMonth(d.getMonth() + 1);
  else if (bp === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (bp === "annual") d.setMonth(d.getMonth() + 12);
  else d.setMonth(d.getMonth() + 1); // default
  return d;
}

export async function GET(req: Request) {
  return withAdmin(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const expiringSoon = searchParams.get("expiringSoon") === "true";

    const where: Prisma.MemberWhereInput = {};

    if (status && status !== "ALL") {
      where.status = status as Prisma.MemberWhereInput["status"];
    }

    if (expiringSoon) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.expiresAt = { gte: now, lte: in7Days };
      where.status = "ACTIVE";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { waNumber: { contains: search } },
        { refNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json(members);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();

    if (!b.name || !b.waNumber || !b.planId || !b.startDate || !b.billingPeriod || b.paidAmount == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startDate = new Date(b.startDate);
    const expiresAt = calcExpiresAt(startDate, b.billingPeriod);
    const refNumber = await generateRefNumber();

    const member = await prisma.member.create({
      data: {
        refNumber,
        name: b.name,
        waNumber: b.waNumber,
        email: b.email ?? null,
        planId: b.planId,
        status: "ACTIVE",
        startDate,
        expiresAt,
        billingPeriod: b.billingPeriod,
        paidAmount: Number(b.paidAmount),
        notes: b.notes ?? null,
      },
      include: { plan: true },
    });

    return NextResponse.json(member, { status: 201 });
  });
}

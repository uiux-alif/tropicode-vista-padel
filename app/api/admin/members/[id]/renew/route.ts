import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

function calcExpiresAt(from: Date, billingPeriod: string): Date {
  const d = new Date(from);
  const bp = billingPeriod.toLowerCase();
  if (bp === "monthly") d.setMonth(d.getMonth() + 1);
  else if (bp === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (bp === "annual") d.setMonth(d.getMonth() + 12);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return withAdmin(async () => {
    const b = await req.json();

    const existing = await prisma.member.findUnique({
      where: { id: params.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Renew from current expiresAt (or now if already expired)
    const renewFrom =
      existing.expiresAt > new Date() ? existing.expiresAt : new Date();
    const newExpiry = calcExpiresAt(renewFrom, existing.billingPeriod);

    const updated = await prisma.member.update({
      where: { id: params.id },
      data: {
        expiresAt: newExpiry,
        status: "ACTIVE",
        paidAmount: b.paidAmount != null ? Number(b.paidAmount) : existing.paidAmount,
        notes: b.notes !== undefined ? b.notes : existing.notes,
      },
      include: { plan: true },
    });

    return NextResponse.json(updated);
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** Calculate expiresAt from startDate + billingPeriod string */
function calcExpiresAt(startDate: Date, billingPeriod: string): Date {
  const d = new Date(startDate);
  const bp = billingPeriod.toLowerCase();
  if (bp === "monthly") d.setMonth(d.getMonth() + 1);
  else if (bp === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (bp === "annual") d.setMonth(d.getMonth() + 12);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  return withAdmin(async () => {
    const member = await prisma.member.findUnique({
      where: { id: params.id },
      include: { plan: true },
    });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(member);
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return withAdmin(async () => {
    const b = await req.json();

    const existing = await prisma.member.findUnique({
      where: { id: params.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Handle renew action
    if (b.action === "renew") {
      const newExpiry = calcExpiresAt(existing.expiresAt, existing.billingPeriod);
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
    }

    // Handle status changes
    type MemberStatus = "ACTIVE" | "EXPIRED" | "PAUSED" | "CANCELLED";
    const actionToStatus: Record<string, MemberStatus> = {
      pause: "PAUSED",
      reactivate: "ACTIVE",
      cancel: "CANCELLED",
      expire: "EXPIRED",
    };

    const data: Record<string, unknown> = {};
    if (b.action && actionToStatus[b.action]) {
      data.status = actionToStatus[b.action];
    }
    if (b.status !== undefined) data.status = b.status;
    if (b.notes !== undefined) data.notes = b.notes;
    if (b.email !== undefined) data.email = b.email;

    const updated = await prisma.member.update({
      where: { id: params.id },
      data,
      include: { plan: true },
    });
    return NextResponse.json(updated);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  return withAdmin(async () => {
    await prisma.member.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}

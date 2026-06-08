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
    if (b.price !== undefined) data.price = Number(b.price) || 0;
    if (b.billingPeriod !== undefined) data.billingPeriod = b.billingPeriod;
    if (b.description !== undefined) data.description = b.description || null;
    if (b.features !== undefined) data.features = Array.isArray(b.features) ? b.features : [];
    if (b.discountPercent !== undefined) data.discountPercent = Number(b.discountPercent) || 0;
    if (b.isFeatured !== undefined) data.isFeatured = b.isFeatured;
    if (b.ctaLabel !== undefined) data.ctaLabel = b.ctaLabel || "Get Started";
    if (b.ctaWaMessage !== undefined) data.ctaWaMessage = b.ctaWaMessage || null;
    if (b.isActive !== undefined) data.isActive = b.isActive;
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;

    const plan = await prisma.membershipPlan.update({ where: { id: params.id }, data });
    revalidateTag("membership");
    return NextResponse.json(plan);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.membershipPlan.delete({ where: { id: params.id } });
    revalidateTag("membership");
    return NextResponse.json({ ok: true });
  });
}

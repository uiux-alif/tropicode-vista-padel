import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const plans = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(plans);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();
    const plan = await prisma.membershipPlan.create({
      data: {
        name: b.name,
        price: Number(b.price) || 0,
        billingPeriod: b.billingPeriod || "Monthly",
        description: b.description || null,
        features: Array.isArray(b.features) ? b.features : [],
        discountPercent: Number(b.discountPercent) ?? 0,
        isFeatured: b.isFeatured ?? false,
        ctaLabel: b.ctaLabel || "Get Started",
        ctaWaMessage: b.ctaWaMessage || null,
        isActive: b.isActive ?? true,
        sortOrder: Number(b.sortOrder) || 0,
      },
    });
    revalidateTag("membership");
    return NextResponse.json(plan, { status: 201 });
  });
}

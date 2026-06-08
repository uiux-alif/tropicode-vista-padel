import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public endpoint — look up an active member by WhatsApp number.
 * Returns only non-sensitive info needed for the booking discount.
 * No auth required — the WA number is the identifier.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wa = searchParams.get("wa")?.replace(/[^0-9]/g, "");

  if (!wa || wa.length < 8) {
    return NextResponse.json({ error: "Invalid WhatsApp number." }, { status: 400 });
  }

  // Try multiple formats: raw digits, with/without leading 0 or 62.
  const variants = Array.from(
    new Set([
      wa,
      wa.replace(/^62/, "0"),   // 628xx → 08xx
      wa.replace(/^0/, "62"),   // 08xx → 628xx
    ])
  );

  const member = await prisma.member.findFirst({
    where: {
      waNumber: { in: variants },
      status: "ACTIVE",
      expiresAt: { gt: new Date() },
    },
    include: {
      plan: {
        select: { name: true, discountPercent: true },
      },
    },
    orderBy: { expiresAt: "desc" },
  });

  if (!member) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    refNumber: member.refNumber,
    name: member.name,
    planName: member.plan.name,
    discountPercent: member.plan.discountPercent,
    expiresAt: member.expiresAt.toISOString(),
  });
}

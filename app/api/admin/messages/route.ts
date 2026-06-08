import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const messages = await prisma.contactMessage.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json(messages);
  });
}

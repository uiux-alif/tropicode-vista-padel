import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const items = await prisma.facility.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(items);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();
    const item = await prisma.facility.create({
      data: {
        name: b.name,
        description: b.description,
        icon: b.icon || "🎾",
        isActive: b.isActive ?? true,
        sortOrder: Number(b.sortOrder) || 0,
      },
    });
    revalidateTag("facilities");
    return NextResponse.json(item, { status: 201 });
  });
}

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
    if (b.description !== undefined) data.description = b.description;
    if (b.icon !== undefined) data.icon = b.icon;
    if (b.isActive !== undefined) data.isActive = b.isActive;
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;

    const item = await prisma.facility.update({ where: { id: params.id }, data });
    revalidateTag("facilities");
    return NextResponse.json(item);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.facility.delete({ where: { id: params.id } });
    revalidateTag("facilities");
    return NextResponse.json({ ok: true });
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.isRead !== undefined) data.isRead = b.isRead;
    if (b.isArchived !== undefined) data.isArchived = b.isArchived;

    const message = await prisma.contactMessage.update({ where: { id: params.id }, data });
    return NextResponse.json(message);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.contactMessage.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}

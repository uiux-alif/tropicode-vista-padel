import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.slotBlock.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  });
}

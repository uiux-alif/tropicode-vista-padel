import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { CONTENT_DEFAULTS } from "@/lib/content-defaults";

export const dynamic = "force-dynamic";

export async function GET() {
  return withAdmin(async () => {
    const rows = await prisma.siteContent.findMany();
    const map: Record<string, string> = {};
    for (const [key, def] of Object.entries(CONTENT_DEFAULTS)) map[key] = def.value;
    for (const r of rows) map[r.key] = r.value;
    return NextResponse.json(map);
  });
}

export async function PUT(req: Request) {
  return withAdmin(async () => {
    const body = (await req.json()) as Record<string, string>;
    for (const [key, value] of Object.entries(body)) {
      const type = CONTENT_DEFAULTS[key]?.type ?? "text";
      await prisma.siteContent.upsert({
        where: { key },
        create: { key, value: String(value), type },
        update: { value: String(value) },
      });
    }
    revalidateTag("content");
    return NextResponse.json({ ok: true });
  });
}

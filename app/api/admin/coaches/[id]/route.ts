import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface ProgramInput { name: string; duration: string; price: number | string; level: string }

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    const b = await req.json();
    const data: Record<string, unknown> = {};
    if (b.name !== undefined) data.name = b.name;
    if (b.title !== undefined) data.title = b.title;
    if (b.specialty !== undefined) data.specialty = b.specialty;
    if (b.experience !== undefined) data.experience = b.experience;
    if (b.certifications !== undefined) data.certifications = Array.isArray(b.certifications) ? b.certifications : [];
    if (b.bio !== undefined) data.bio = b.bio || null;
    if (b.photoUrl !== undefined) data.photoUrl = b.photoUrl || null;
    if (b.isActive !== undefined) data.isActive = b.isActive;
    if (b.sortOrder !== undefined) data.sortOrder = Number(b.sortOrder) || 0;

    // Replace programs wholesale when provided.
    if (Array.isArray(b.programs)) {
      const programs: ProgramInput[] = b.programs;
      await prisma.coachProgram.deleteMany({ where: { coachId: params.id } });
      await prisma.coachProgram.createMany({
        data: programs.map((p) => ({
          coachId: params.id,
          name: p.name,
          duration: p.duration,
          price: Number(p.price) || 0,
          level: p.level,
        })),
      });
    }

    const coach = await prisma.coach.update({
      where: { id: params.id },
      data,
      include: { programs: true },
    });
    revalidateTag("coaches");
    return NextResponse.json(coach);
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withAdmin(async () => {
    await prisma.coach.delete({ where: { id: params.id } });
    revalidateTag("coaches");
    return NextResponse.json({ ok: true });
  });
}

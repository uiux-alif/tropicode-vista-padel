import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface ProgramInput { name: string; duration: string; price: number | string; level: string }

export async function GET() {
  return withAdmin(async () => {
    const coaches = await prisma.coach.findMany({
      orderBy: { sortOrder: "asc" },
      include: { programs: true },
    });
    return NextResponse.json(coaches);
  });
}

export async function POST(req: Request) {
  return withAdmin(async () => {
    const b = await req.json();
    const programs: ProgramInput[] = Array.isArray(b.programs) ? b.programs : [];
    const coach = await prisma.coach.create({
      data: {
        name: b.name,
        title: b.title,
        specialty: b.specialty,
        experience: b.experience,
        certifications: Array.isArray(b.certifications) ? b.certifications : [],
        bio: b.bio || null,
        photoUrl: b.photoUrl || null,
        isActive: b.isActive ?? true,
        sortOrder: Number(b.sortOrder) || 0,
        programs: {
          create: programs.map((p) => ({
            name: p.name,
            duration: p.duration,
            price: Number(p.price) || 0,
            level: p.level,
          })),
        },
      },
      include: { programs: true },
    });
    revalidateTag("coaches");
    return NextResponse.json(coach, { status: 201 });
  });
}

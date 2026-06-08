import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  waNumber: z.string().max(20).optional(),
  subject: z.string().min(1).max(100),
  message: z.string().min(5).max(2000),
});

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 400 });
  }

  try {
    await prisma.contactMessage.create({ data: parsed.data });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("contact error", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dateKeyToUtc, addHours } from "@/lib/utils";
import { calculatePrice } from "@/lib/pricing";
import { generateRefNumber, occupiedSlots } from "@/lib/booking";
import { getLockMinutes } from "@/lib/settings";
import { getContent, getAllContent } from "@/lib/content";
import { bookerToClubLink } from "@/lib/whatsapp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BookingSchema = z.object({
  courtId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:00$/),
  duration: z.number().int().min(1).max(3),
  bookerName: z.string().min(2).max(100),
  bookerWa: z.string().min(8).max(20),
  players: z.number().int().min(2).max(4),
  addonRacket: z.boolean().optional().default(false),
  addonBall: z.boolean().optional().default(false),
  addonCoaching: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
  memberRef: z.string().optional(),
  memberDiscount: z.number().int().min(0).max(100).optional().default(0),
});

export async function POST(req: Request) {
  // Rate limit: 5 booking attempts per IP per hour.
  const ip = clientIp(req);
  if (!rateLimit(`booking:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const dateUtc = dateKeyToUtc(input.date);
  const wanted = occupiedSlots(input.startTime, input.duration);
  const startHour = parseInt(input.startTime.split(":")[0], 10);
  if (startHour + input.duration > 23) {
    return NextResponse.json({ error: "Booking exceeds operating hours." }, { status: 400 });
  }

  try {
    const lockMinutes = await getLockMinutes();
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);

    // Pricing context
    const [court, globalPricing] = await Promise.all([
      prisma.court.findUnique({ where: { id: input.courtId }, include: { pricing: true } }),
      prisma.globalPricing.findFirst(),
    ]);
    if (!court || !court.isActive) {
      return NextResponse.json({ error: "Court not found." }, { status: 404 });
    }

    // If memberRef is provided, verify it's legitimate and cap the discount.
    let verifiedDiscount = 0;
    let verifiedMemberRef: string | null = null;
    if (input.memberRef && input.memberDiscount > 0) {
      const member = await prisma.member.findFirst({
        where: {
          refNumber: input.memberRef,
          status: "ACTIVE",
          expiresAt: { gt: now },
        },
        include: { plan: { select: { discountPercent: true } } },
      });
      if (member) {
        // Server-side cap: never give more discount than the plan authorises.
        verifiedDiscount = Math.min(input.memberDiscount, member.plan.discountPercent);
        verifiedMemberRef = member.refNumber;
      }
    }

    const breakdown = calculatePrice({
      startHour,
      duration: input.duration,
      priceNormal: court.pricing?.priceNormal ?? 0,
      pricePeak: court.pricing?.pricePeak ?? 0,
      peakStart: globalPricing?.peakHourStart ?? 17,
      peakEnd: globalPricing?.peakHourEnd ?? 22,
      addonRacket: input.addonRacket,
      addonBall: input.addonBall,
      addonCoaching: input.addonCoaching,
      racketRental: globalPricing?.racketRental ?? 30000,
      ballRental: globalPricing?.ballRental ?? 15000,
      coachingAddon: globalPricing?.coachingAddon ?? 200000,
      memberDiscountPercent: verifiedDiscount,
    });

    const refNumber = await generateRefNumber();
    const endTime = addHours(input.startTime, input.duration);

    // Atomic check-and-create inside a transaction (serializable).
    const booking = await prisma.$transaction(
      async (tx) => {
        // Re-check availability: active bookings + blocks for this court/date.
        const existing = await tx.booking.findMany({
          where: {
            courtId: input.courtId,
            date: dateUtc,
            OR: [
              { status: "CONFIRMED" },
              { status: "PENDING", lockedUntil: { gt: now } },
            ],
          },
          select: { startTime: true, duration: true },
        });
        const blocks = await tx.slotBlock.findMany({
          where: { courtId: input.courtId, date: dateUtc },
          select: { startTime: true, endTime: true },
        });

        const taken = new Set<string>();
        for (const b of existing) {
          for (const s of occupiedSlots(b.startTime, b.duration)) taken.add(s);
        }
        for (const blk of blocks) {
          const sH = parseInt(blk.startTime.split(":")[0], 10);
          const eH = parseInt(blk.endTime.split(":")[0], 10);
          for (let h = sH; h < eH; h++) taken.add(`${String(h).padStart(2, "0")}:00`);
        }

        const conflict = wanted.some((s) => taken.has(s));
        if (conflict) {
          throw new Error("SLOT_TAKEN");
        }

        return tx.booking.create({
          data: {
            refNumber,
            courtId: input.courtId,
            date: dateUtc,
            startTime: input.startTime,
            duration: input.duration,
            endTime,
            bookerName: input.bookerName,
            bookerWa: input.bookerWa,
            players: input.players,
            addonRacket: input.addonRacket,
            addonBall: input.addonBall,
            addonCoaching: input.addonCoaching,
            notes: input.notes,
            estimatedTotal: breakdown.total,
            memberRef: verifiedMemberRef,
            memberDiscount: verifiedDiscount,
            status: "PENDING",
            lockedUntil,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    // Build WhatsApp confirmation deep link.
    const content = await getAllContent();
    const clubWa = getContent(content, "global.whatsapp");
    const addonLabels: string[] = [];
    if (input.addonRacket) addonLabels.push("Racket Rental");
    if (input.addonBall) addonLabels.push("Ball Rental");
    if (input.addonCoaching) addonLabels.push("Coaching");

    const waLink = bookerToClubLink(clubWa, {
      refNumber: booking.refNumber,
      bookerName: booking.bookerName,
      courtName: court.name,
      courtType: court.type,
      dateKey: input.date,
      startTime: booking.startTime,
      duration: booking.duration,
      players: booking.players,
      addons: addonLabels,
      estimatedTotal: booking.estimatedTotal,
    });

    return NextResponse.json(
      {
        refNumber: booking.refNumber,
        id: booking.id,
        waLink,
        lockedUntil,
        memberDiscount: verifiedDiscount,
        discountSaved: breakdown.memberDiscount,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json(
        { error: "Sorry, that slot was just taken. Please pick another." },
        { status: 409 }
      );
    }
    console.error("booking error", err);
    return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
  }
}

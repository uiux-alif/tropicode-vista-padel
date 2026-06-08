import { PrismaClient, BookingStatus, MemberStatus } from "@prisma/client";

const prisma = new PrismaClient();

// ── Name pools ────────────────────────────────────────────────────────────

const MEMBER_NAMES = [
  "Andini Wijaya",
  "Budi Santoso",
  "Clara Margaretha",
  "Dion Pratama",
  "Eka Purnama",
  "Farida Noor",
  "Gilang Ramadhan",
  "Hendra Kusuma",
  "Indira Sari",
  "Joko Widodo",
  "Kartika Dewi",
  "Luki Prabowo",
  "Maya Rahma",
  "Niko Saputra",
  "Okta Lestari",
  "Petra Gunawan",
  "Qira Ananda",
  "Reza Maulana",
  "Sinta Permata",
  "Tomi Halim",
];

const EXTRA_NAMES = [
  "Agung Setiawan",
  "Bella Putri",
  "Cahyo Nugroho",
  "Dinda Pramesti",
  "Erwan Susanto",
  "Fitri Handayani",
  "Guntur Wicaksono",
  "Hani Safitri",
  "Irfan Maulana",
  "Jasmine Putri",
  "Kevin Hartono",
  "Laila Rahma",
  "Mirza Fauzi",
  "Nadia Kusuma",
  "Oscar Putra",
  "Prita Dewi",
  "Rizky Firmansyah",
  "Sari Widiastuti",
  "Teguh Prasetyo",
  "Umar Bakri",
  "Vina Sari",
  "Wahyu Hidayat",
  "Xena Pratiwi",
  "Yogi Saputra",
  "Zara Puspita",
  "Arif Nugroho",
  "Bunga Permata",
  "Candra Wijaya",
  "Desi Ratnasari",
  "Eko Santoso",
];

// ── Helpers ───────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function waFromIndex(i: number): string {
  return `628${String(12000000000 + i * 100).padStart(11, "0")}`.slice(0, 14);
}

function randomWa(): string {
  const base = randomBetween(81200000000, 81299999999);
  return `628${base}`;
}

/** Generate a booking ref: VPC-2026-NNNN */
function bookingRef(n: number): string {
  return `VPC-2026-${String(n).padStart(4, "0")}`;
}

/** Generate a member ref: MBR-2026-NNNN */
function memberRef(n: number): string {
  return `MBR-2026-${String(n).padStart(4, "0")}`;
}

/** Determine booking status based on weighted distribution */
function pickStatus(dayOffset: number): BookingStatus {
  const r = Math.random();
  // For recent past (< 7 days old) allow more PENDING/EXPIRED
  if (dayOffset > -7) {
    if (r < 0.60) return "CONFIRMED";
    if (r < 0.75) return "CANCELLED";
    if (r < 0.88) return "EXPIRED";
    return "REJECTED";
  }
  if (r < 0.70) return "CONFIRMED";
  if (r < 0.85) return "CANCELLED";
  if (r < 0.95) return "EXPIRED";
  return "REJECTED";
}

/** Pick a start hour based on time distribution */
function pickStartHour(): number {
  const r = Math.random();
  if (r < 0.25) return randomBetween(7, 11); // morning 25%
  if (r < 0.55) return randomBetween(12, 16); // afternoon 30%
  return randomBetween(17, 21); // peak evening 45%
}

/** Pick duration: 60% 1hr, 30% 2hr, 10% 3hr */
function pickDuration(): number {
  const r = Math.random();
  if (r < 0.60) return 1;
  if (r < 0.90) return 2;
  return 3;
}

/** Calculate estimated total */
function calcTotal(
  priceNormal: number,
  pricePeak: number,
  startHour: number,
  duration: number,
  peakStart: number,
  peakEnd: number,
  discountPercent: number
): number {
  let total = 0;
  for (let h = 0; h < duration; h++) {
    const hr = startHour + h;
    const isPeak = hr >= peakStart && hr < peakEnd;
    total += isPeak ? pricePeak : priceNormal;
  }
  if (discountPercent > 0) {
    total = Math.round(total * (1 - discountPercent / 100));
  }
  return total;
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding demo data...");

  // 1. Get courts from DB
  const courts = await prisma.court.findMany({
    where: { isActive: true },
    include: { pricing: true },
    orderBy: { sortOrder: "asc" },
  });

  if (courts.length === 0) {
    console.error("❌ No active courts found. Please seed courts first.");
    return;
  }

  // 2. Get global pricing for peak hours
  const globalPricing = await prisma.globalPricing.findFirst();
  const peakStart = globalPricing?.peakHourStart ?? 17;
  const peakEnd = globalPricing?.peakHourEnd ?? 22;

  // 3. Get membership plans
  const plans = await prisma.membershipPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const proPlan = plans.find((p) => p.name.toLowerCase().includes("pro"));
  const elitePlan = plans.find((p) => p.name.toLowerCase().includes("elite"));
  const casualPlan = plans.find((p) => p.price === 0) ?? plans[plans.length - 1];

  console.log(
    `📊 Found ${courts.length} courts, ${plans.length} plans ` +
    `(Pro: ${proPlan?.name ?? "N/A"}, Elite: ${elitePlan?.name ?? "N/A"})`
  );

  // 4. Seed 20 members
  console.log("👤 Seeding members...");

  // Member configs: 8 Pro, 5 Elite, 7 Casual
  const memberConfigs: Array<{
    name: string;
    waIndex: number;
    planId: string;
    discountPercent: number;
    status: MemberStatus;
    startMonthsAgo: number;
    durationMonths: number;
  }> = [];

  // 8 Pro members
  const proMembers = [
    { name: MEMBER_NAMES[0], status: "ACTIVE" as MemberStatus, startMonthsAgo: 2, durationMonths: 1 },
    { name: MEMBER_NAMES[1], status: "ACTIVE" as MemberStatus, startMonthsAgo: 1, durationMonths: 1 },
    { name: MEMBER_NAMES[2], status: "ACTIVE" as MemberStatus, startMonthsAgo: 0, durationMonths: 1 },
    { name: MEMBER_NAMES[3], status: "EXPIRED" as MemberStatus, startMonthsAgo: 3, durationMonths: 1 },
    { name: MEMBER_NAMES[4], status: "ACTIVE" as MemberStatus, startMonthsAgo: 1, durationMonths: 1 },
    // expiring in 3 days — start far enough back so expiry = now + 3 days
    { name: MEMBER_NAMES[5], status: "ACTIVE" as MemberStatus, startMonthsAgo: 0, durationMonths: 0 /* special */ },
    { name: MEMBER_NAMES[6], status: "EXPIRED" as MemberStatus, startMonthsAgo: 2, durationMonths: 1 },
    { name: MEMBER_NAMES[7], status: "ACTIVE" as MemberStatus, startMonthsAgo: 0, durationMonths: 1 },
  ];

  for (let i = 0; i < proMembers.length; i++) {
    const pm = proMembers[i];
    memberConfigs.push({
      name: pm.name,
      waIndex: i,
      planId: proPlan?.id ?? casualPlan?.id ?? plans[0].id,
      discountPercent: proPlan?.discountPercent ?? 15,
      status: pm.status,
      startMonthsAgo: pm.startMonthsAgo,
      durationMonths: pm.durationMonths,
    });
  }

  // 5 Elite members
  const eliteMembers = [
    { name: MEMBER_NAMES[8], status: "ACTIVE" as MemberStatus, startMonthsAgo: 2 },
    { name: MEMBER_NAMES[9], status: "ACTIVE" as MemberStatus, startMonthsAgo: 1 },
    { name: MEMBER_NAMES[10], status: "EXPIRED" as MemberStatus, startMonthsAgo: 3 },
    { name: MEMBER_NAMES[11], status: "PAUSED" as MemberStatus, startMonthsAgo: 1 },
    { name: MEMBER_NAMES[12], status: "ACTIVE" as MemberStatus, startMonthsAgo: 0 },
  ];

  for (let i = 0; i < eliteMembers.length; i++) {
    const em = eliteMembers[i];
    memberConfigs.push({
      name: em.name,
      waIndex: 8 + i,
      planId: elitePlan?.id ?? casualPlan?.id ?? plans[0].id,
      discountPercent: elitePlan?.discountPercent ?? 25,
      status: em.status,
      startMonthsAgo: em.startMonthsAgo,
      durationMonths: 1,
    });
  }

  // 7 Casual
  for (let i = 0; i < 7; i++) {
    memberConfigs.push({
      name: MEMBER_NAMES[13 + i],
      waIndex: 13 + i,
      planId: casualPlan?.id ?? plans[0].id,
      discountPercent: casualPlan?.discountPercent ?? 0,
      status: "ACTIVE" as MemberStatus,
      startMonthsAgo: randomBetween(0, 3),
      durationMonths: 1,
    });
  }

  const now = new Date();
  const createdMembers: Array<{
    refNumber: string;
    waNumber: string;
    discountPercent: number;
    status: MemberStatus;
  }> = [];

  for (let idx = 0; idx < memberConfigs.length; idx++) {
    const cfg = memberConfigs[idx];
    const refNum = memberRef(idx + 1);
    const waNumber = waFromIndex(cfg.waIndex);

    let startDate: Date;
    let expiresAt: Date;

    // Special case: member expiring in 3 days
    if (idx === 5) {
      expiresAt = addDays(now, 3);
      startDate = addMonths(expiresAt, -1);
    } else {
      startDate = addDays(addMonths(now, -cfg.startMonthsAgo), -randomBetween(0, 15));
      expiresAt = addMonths(startDate, cfg.durationMonths > 0 ? cfg.durationMonths : 1);
    }

    await prisma.member.upsert({
      where: { refNumber: refNum },
      update: {},
      create: {
        refNumber: refNum,
        name: cfg.name,
        waNumber,
        email: null,
        planId: cfg.planId,
        status: cfg.status,
        startDate,
        expiresAt,
        billingPeriod: "Monthly",
        paidAmount: plans.find((p) => p.id === cfg.planId)?.price ?? 0,
        notes: null,
      },
    });

    createdMembers.push({ refNumber: refNum, waNumber, discountPercent: cfg.discountPercent, status: cfg.status });
  }

  console.log(`✅ Seeded ${memberConfigs.length} members`);

  // Active members with discounts (Pro/Elite) that can be used for bookings
  const discountMembers = createdMembers.filter(
    (m) => m.discountPercent > 0 && m.status === "ACTIVE"
  );

  // 5. Seed historical bookings (past 90 days)
  console.log("📅 Seeding historical bookings...");

  let bookingCounter = 1;
  let totalBooked = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = -90; dayOffset < 0; dayOffset++) {
    const bookingDate = addDays(today, dayOffset);
    const dateKey = toDateKey(bookingDate);

    // Determine day type: 20% busy, 60% normal, 20% quiet
    const r = Math.random();
    let bookingsForDay: number;
    if (r < 0.20) {
      bookingsForDay = randomBetween(8, 14); // busy
    } else if (r < 0.80) {
      bookingsForDay = randomBetween(4, 8); // normal
    } else {
      bookingsForDay = randomBetween(1, 3); // quiet
    }

    // Track used slots to avoid duplicates
    const usedSlots = new Set<string>();

    for (let b = 0; b < bookingsForDay; b++) {
      const court = randomChoice(courts);
      const startHour = pickStartHour();
      const duration = pickDuration();

      // Check slot conflict (simple check)
      let slotKey = `${court.id}-${startHour}`;
      let attempts = 0;
      while (usedSlots.has(slotKey) && attempts < 10) {
        const newHour = pickStartHour();
        const newCourt = randomChoice(courts);
        slotKey = `${newCourt.id}-${newHour}`;
        attempts++;
      }
      if (usedSlots.has(slotKey)) continue;
      usedSlots.add(slotKey);

      const courtId = slotKey.split("-")[0];
      const actualCourt = courts.find((c) => c.id === courtId) ?? court;
      const actualHour = parseInt(slotKey.split("-")[1], 10);

      const startTime = `${String(actualHour).padStart(2, "0")}:00`;
      const endHour = actualHour + duration;
      const endTime = `${String(endHour).padStart(2, "0")}:00`;

      const status = pickStatus(dayOffset);
      const refNum = bookingRef(bookingCounter++);

      // Determine if member discount applies (~30% of confirmed bookings)
      let memberRef = null;
      let memberDiscount = 0;
      if (status === "CONFIRMED" && discountMembers.length > 0 && Math.random() < 0.30) {
        const dm = randomChoice(discountMembers);
        memberRef = dm.refNumber;
        memberDiscount = dm.discountPercent;
      }

      const priceNormal = actualCourt.pricing?.priceNormal ?? 120000;
      const pricePeak = actualCourt.pricing?.pricePeak ?? 180000;
      const estimatedTotal = calcTotal(
        priceNormal, pricePeak, actualHour, duration,
        peakStart, peakEnd, memberDiscount
      );

      const bookerName = randomChoice(EXTRA_NAMES);
      const bookerWa = randomWa();

      // Set dates on the booking date
      const bookingDateTime = new Date(bookingDate);
      bookingDateTime.setHours(randomBetween(6, 20), 0, 0, 0);

      // lockedUntil for historical bookings = booking date + 1hr (expired locks)
      const lockedUntil = new Date(bookingDateTime);
      lockedUntil.setHours(lockedUntil.getHours() + 1);

      const confirmedAt = status === "CONFIRMED"
        ? new Date(bookingDateTime.getTime() + randomBetween(5, 55) * 60000)
        : null;
      const rejectedAt = status === "REJECTED"
        ? new Date(bookingDateTime.getTime() + randomBetween(5, 55) * 60000)
        : null;
      const cancelledAt = status === "CANCELLED"
        ? new Date(bookingDateTime.getTime() + randomBetween(10, 120) * 60000)
        : null;
      const expiredAt = status === "EXPIRED"
        ? lockedUntil
        : null;

      // The booking date field should be UTC midnight of that day
      const dateUtc = new Date(Date.UTC(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate()
      ));

      await prisma.booking.upsert({
        where: { refNumber: refNum },
        update: {},
        create: {
          refNumber: refNum,
          courtId: actualCourt.id,
          date: dateUtc,
          startTime,
          duration,
          endTime,
          bookerName,
          bookerWa,
          players: randomBetween(2, 4),
          addonRacket: Math.random() < 0.15,
          addonBall: Math.random() < 0.10,
          addonCoaching: Math.random() < 0.08,
          notes: null,
          estimatedTotal,
          memberRef,
          memberDiscount,
          status,
          lockedUntil,
          confirmedAt,
          rejectedAt,
          cancelledAt,
          expiredAt,
          createdAt: bookingDateTime,
        },
      });

      totalBooked++;
    }
  }

  console.log(`✅ Seeded ${totalBooked} historical bookings`);

  // 6. Create 2-4 PENDING bookings for today
  console.log("⏳ Creating today's pending bookings...");

  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const pendingCount = randomBetween(2, 4);
  const usedTodaySlots = new Set<string>();
  let pendingCreated = 0;

  for (let p = 0; p < pendingCount; p++) {
    const court = randomChoice(courts);
    const startHour = pickStartHour();
    const slotKey = `${court.id}-${startHour}`;

    if (usedTodaySlots.has(slotKey)) continue;
    usedTodaySlots.add(slotKey);

    const duration = pickDuration();
    const endHour = startHour + duration;
    const startTime = `${String(startHour).padStart(2, "0")}:00`;
    const endTime = `${String(endHour).padStart(2, "0")}:00`;

    const refNum = bookingRef(bookingCounter++);
    const priceNormal = court.pricing?.priceNormal ?? 120000;
    const pricePeak = court.pricing?.pricePeak ?? 180000;
    const estimatedTotal = calcTotal(priceNormal, pricePeak, startHour, duration, peakStart, peakEnd, 0);

    const lockedUntil = new Date(now.getTime() + 30 * 60 * 1000); // now + 30 min

    await prisma.booking.upsert({
      where: { refNumber: refNum },
      update: {},
      create: {
        refNumber: refNum,
        courtId: court.id,
        date: todayUtc,
        startTime,
        duration,
        endTime,
        bookerName: randomChoice(EXTRA_NAMES),
        bookerWa: randomWa(),
        players: randomBetween(2, 4),
        addonRacket: false,
        addonBall: false,
        addonCoaching: false,
        notes: null,
        estimatedTotal,
        memberRef: null,
        memberDiscount: 0,
        status: "PENDING",
        lockedUntil,
      },
    });
    pendingCreated++;
  }

  console.log(`✅ Created ${pendingCreated} pending bookings for today`);

  // 7. Summary
  const memberCount = await prisma.member.count();
  const bookingCount = await prisma.booking.count();
  console.log(`\n📊 Summary:`);
  console.log(`   Members total: ${memberCount}`);
  console.log(`   Bookings total: ${bookingCount}`);
  console.log("\n✅ Demo seed complete");
}

main().catch(console.error).finally(() => prisma.$disconnect());

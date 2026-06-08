import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { CONTENT_DEFAULTS } from "../lib/content-defaults";
import { SETTING_DEFAULTS } from "../lib/settings";

const prisma = new PrismaClient();

// ── Source data (from the original static project) ──
const COURTS = [
  {
    key: "courtA", name: "Court A", type: "Indoor Premium", surface: "Artificial Grass",
    lighting: "LED Professional", capacity: 4, badge: "Most Popular",
    features: ["Air Conditioned", "Professional Glass Walls", "LED Lighting", "Scoreboard"],
    priceNormal: 120000, pricePeak: 180000, sortOrder: 1,
  },
  {
    key: "courtB", name: "Court B", type: "Indoor Standard", surface: "Artificial Grass",
    lighting: "LED Professional", capacity: 4, badge: null,
    features: ["Air Conditioned", "Glass Walls", "LED Lighting"],
    priceNormal: 120000, pricePeak: 180000, sortOrder: 2,
  },
  {
    key: "courtC", name: "Court C", type: "Semi-Indoor", surface: "Artificial Grass",
    lighting: "LED Standard", capacity: 4, badge: null,
    features: ["Ventilated", "Partial Glass Walls", "LED Lighting"],
    priceNormal: 100000, pricePeak: 150000, sortOrder: 3,
  },
  {
    key: "courtIndoor", name: "The Arena", type: "Indoor VIP", surface: "Panoramic Turf",
    lighting: "Stadium LED", capacity: 4, badge: "VIP",
    features: ["Full AC", "Panoramic Glass", "Stadium Lighting", "Camera System", "Lounge Access"],
    priceNormal: 150000, pricePeak: 220000, sortOrder: 4,
  },
  {
    key: "courtOutdoor", name: "Open Court", type: "Outdoor", surface: "Synthetic Turf",
    lighting: "Floodlights", capacity: 4, badge: null,
    features: ["Floodlights", "Shaded Seating", "Open Air", "Scenic View"],
    priceNormal: 90000, pricePeak: 130000, sortOrder: 5,
  },
];

const FACILITIES = [
  { name: "Shower Rooms", description: "Hot water, private cubicles and luxury amenities to freshen up post-match.", icon: "🚿" },
  { name: "Locker Rooms", description: "Secure digital-lock lockers — leave your valuables worry-free while you play.", icon: "🔒" },
  { name: "Café & Lounge", description: "Post-match drinks, light bites, and social vibes in our stylish in-club café.", icon: "☕" },
  { name: "Parking Area", description: "Ample, secure parking for cars and motorcycles — complimentary with booking.", icon: "🅿️" },
  { name: "Equipment Rental", description: "High-quality padel rackets and balls available for rent at the front desk.", icon: "🎾" },
  { name: "Pro Shop", description: "Premium padel gear, apparel and accessories from top-tier brands.", icon: "🛍️" },
  { name: "Free WiFi", description: "High-speed WiFi throughout the club — stream, share, and stay connected.", icon: "📶" },
  { name: "Changing Rooms", description: "Spacious, spotless changing rooms with full-length mirrors and premium fixtures.", icon: "👕" },
];

const COACHES = [
  {
    name: "Marco Alvarez", title: "Head Coach", specialty: "Competitive & Advanced",
    experience: "12 Years", certifications: ["WPT Certified", "FIP Level 3"],
    bio: "Marco brings over a decade of competitive experience, having coached players to national-level tournaments.",
    sortOrder: 1,
    programs: [
      { name: "Private Coaching", duration: "60 min", price: 400000, level: "All Levels" },
      { name: "Advanced Clinic", duration: "90 min", price: 250000, level: "Intermediate+" },
    ],
  },
  {
    name: "Sarah Tan", title: "Junior & Beginner Coach", specialty: "Beginners & Kids",
    experience: "7 Years", certifications: ["FIP Level 2", "Youth Sports Certified"],
    bio: "Sarah specialises in making padel approachable and fun for newcomers and young players.",
    sortOrder: 2,
    programs: [
      { name: "Beginner Coaching", duration: "60 min", price: 250000, level: "Beginner" },
      { name: "Kids Padel Class", duration: "60 min", price: 200000, level: "Kids 8–14" },
    ],
  },
  {
    name: "Rafi Putra", title: "Group & Social Coach", specialty: "Group Sessions & Fitness",
    experience: "5 Years", certifications: ["FIP Level 1", "Sports Fitness Certified"],
    bio: "Rafi runs energetic group sessions that blend skill-building with fitness and fun.",
    sortOrder: 3,
    programs: [
      { name: "Group Session", duration: "90 min", price: 150000, level: "All Levels" },
      { name: "Intermediate Clinic", duration: "90 min", price: 200000, level: "Intermediate" },
    ],
  },
];

const MEMBERSHIP_PLANS = [
  {
    name: "Casual", price: 0, billingPeriod: "Monthly",
    description: "Pay as you play — no commitment.",
    features: ["Standard court rates", "Online booking", "Access to all facilities"],
    discountPercent: 0,
    isFeatured: false, ctaLabel: "Get Started", sortOrder: 1,
    ctaWaMessage: "Halo Vista Padel! Saya tertarik dengan opsi Casual.",
  },
  {
    name: "Pro", price: 750000, billingPeriod: "Monthly",
    description: "For regular players who want more value.",
    features: ["15% off court fees", "Priority booking (48h ahead)", "1 free group clinic/month", "Free racket rental"],
    discountPercent: 15,
    isFeatured: true, ctaLabel: "Join Pro", sortOrder: 2,
    ctaWaMessage: "Halo Vista Padel! Saya ingin bergabung dengan membership Pro.",
  },
  {
    name: "Elite", price: 1800000, billingPeriod: "Monthly",
    description: "The ultimate Vista experience.",
    features: ["25% off court fees", "Priority booking (7 days ahead)", "4 free clinics/month", "Free racket & ball rental", "Lounge access", "Guest passes"],
    discountPercent: 25,
    isFeatured: false, ctaLabel: "Go Elite", sortOrder: 3,
    ctaWaMessage: "Halo Vista Padel! Saya ingin bergabung dengan membership Elite.",
  },
];

const TESTIMONIALS = [
  { name: "Andini W.", role: "Member since 2024", rating: 5, text: "Best padel courts in Jakarta. The booking flow is so smooth and the staff confirm super fast on WhatsApp.", sortOrder: 1 },
  { name: "Budi S.", role: "Weekend player", rating: 5, text: "The Arena is incredible — feels like playing in a stadium. Coaching with Marco leveled up my game.", sortOrder: 2 },
  { name: "Clara M.", role: "Pro member", rating: 5, text: "Love the community vibe and the café. Worth every rupiah of the Pro membership.", sortOrder: 3 },
];

async function main() {
  console.log("🌱 Seeding Vista Padel Club...");

  // ── Courts + pricing ──
  for (const c of COURTS) {
    const court = await prisma.court.upsert({
      where: { id: c.key },
      update: {
        name: c.name, type: c.type, surface: c.surface, lighting: c.lighting,
        capacity: c.capacity, badge: c.badge, features: c.features, sortOrder: c.sortOrder,
      },
      create: {
        id: c.key, name: c.name, type: c.type, surface: c.surface, lighting: c.lighting,
        capacity: c.capacity, badge: c.badge, features: c.features, sortOrder: c.sortOrder,
      },
    });
    await prisma.courtPricing.upsert({
      where: { courtId: court.id },
      update: { priceNormal: c.priceNormal, pricePeak: c.pricePeak },
      create: { courtId: court.id, priceNormal: c.priceNormal, pricePeak: c.pricePeak },
    });
  }
  console.log(`  ✓ ${COURTS.length} courts + pricing`);

  // ── Global pricing ──
  const existingGlobal = await prisma.globalPricing.findFirst();
  if (!existingGlobal) {
    await prisma.globalPricing.create({
      data: { peakHourStart: 17, peakHourEnd: 22, racketRental: 30000, ballRental: 15000, coachingAddon: 200000 },
    });
  }
  console.log("  ✓ global pricing");

  // ── Facilities ──
  await prisma.facility.deleteMany();
  await prisma.facility.createMany({
    data: FACILITIES.map((f, i) => ({ ...f, sortOrder: i + 1 })),
  });
  console.log(`  ✓ ${FACILITIES.length} facilities`);

  // ── Coaches + programs ──
  await prisma.coachProgram.deleteMany();
  await prisma.coach.deleteMany();
  for (const co of COACHES) {
    await prisma.coach.create({
      data: {
        name: co.name, title: co.title, specialty: co.specialty, experience: co.experience,
        certifications: co.certifications, bio: co.bio, sortOrder: co.sortOrder,
        programs: { create: co.programs },
      },
    });
  }
  console.log(`  ✓ ${COACHES.length} coaches + programs`);

  // ── Membership plans ──
  await prisma.membershipPlan.deleteMany();
  await prisma.membershipPlan.createMany({
    data: MEMBERSHIP_PLANS.map((p) => ({
      name: p.name,
      price: p.price,
      billingPeriod: p.billingPeriod,
      description: p.description,
      features: p.features,
      discountPercent: p.discountPercent,
      isFeatured: p.isFeatured,
      ctaLabel: p.ctaLabel,
      ctaWaMessage: p.ctaWaMessage,
      isActive: true,
      sortOrder: p.sortOrder,
    })),
  });
  console.log(`  ✓ ${MEMBERSHIP_PLANS.length} membership plans`);

  // ── Testimonials ──
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({ data: TESTIMONIALS });
  console.log(`  ✓ ${TESTIMONIALS.length} testimonials`);

  // ── Site content ──
  for (const [key, def] of Object.entries(CONTENT_DEFAULTS)) {
    await prisma.siteContent.upsert({
      where: { key },
      update: {}, // do not overwrite admin edits on re-seed
      create: { key, value: def.value, type: def.type },
    });
  }
  console.log(`  ✓ ${Object.keys(CONTENT_DEFAULTS).length} content keys`);

  // ── App settings ──
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.appSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log("  ✓ app settings");

  // ── Default admin ──
  const email = process.env.ADMIN_EMAIL ?? "admin@vistapadel.id";
  const password = process.env.ADMIN_PASSWORD ?? "vista-admin-2026";
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), name: "Vista Admin" },
    create: { email, name: "Vista Admin", passwordHash: hashPassword(password) },
  });
  console.log(`  ✓ admin user (${email})`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

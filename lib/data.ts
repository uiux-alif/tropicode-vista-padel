import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// All fetchers are wrapped in unstable_cache so Next.js serves from memory
// between revalidations instead of hitting Supabase (ap-northeast-2) on
// every request. The admin PATCH/POST handlers call revalidateTag() to bust
// the relevant cache immediately after a write.

// ── Courts ────────────────────────────────────────────────────────────────

const _getCourts = async (limit?: number) => {
  try {
    return await prisma.court.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { pricing: true },
      ...(limit ? { take: limit } : {}),
    });
  } catch {
    return [];
  }
};

export const getCourts = (limit?: number) =>
  unstable_cache(_getCourts, ["courts", String(limit ?? "all")], {
    tags: ["courts"],
    revalidate: 60,
  })(limit);

// ── Coaches ───────────────────────────────────────────────────────────────

const _getCoaches = async (limit?: number) => {
  try {
    return await prisma.coach.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: { programs: true },
      ...(limit ? { take: limit } : {}),
    });
  } catch {
    return [];
  }
};

export const getCoaches = (limit?: number) =>
  unstable_cache(_getCoaches, ["coaches", String(limit ?? "all")], {
    tags: ["coaches"],
    revalidate: 60,
  })(limit);

// ── Facilities ────────────────────────────────────────────────────────────

export const getFacilities = unstable_cache(
  async () => {
    try {
      return await prisma.facility.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      return [];
    }
  },
  ["facilities"],
  { tags: ["facilities"], revalidate: 60 }
);

// ── Membership plans ──────────────────────────────────────────────────────

export const getMembershipPlans = unstable_cache(
  async () => {
    try {
      return await prisma.membershipPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      return [];
    }
  },
  ["membership"],
  { tags: ["membership"], revalidate: 60 }
);

// ── Testimonials ──────────────────────────────────────────────────────────

export const getTestimonials = unstable_cache(
  async () => {
    try {
      return await prisma.testimonial.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
    } catch {
      return [];
    }
  },
  ["testimonials"],
  { tags: ["testimonials"], revalidate: 60 }
);

// ── Gallery ───────────────────────────────────────────────────────────────

export const getGallery = unstable_cache(
  async () => {
    try {
      return await prisma.galleryImage.findMany({ orderBy: { sortOrder: "asc" } });
    } catch {
      return [];
    }
  },
  ["gallery"],
  { tags: ["gallery"], revalidate: 60 }
);

// ── Global pricing ────────────────────────────────────────────────────────

export const getGlobalPricing = unstable_cache(
  async () => {
    try {
      return await prisma.globalPricing.findFirst();
    } catch {
      return null;
    }
  },
  ["global-pricing"],
  { tags: ["pricing"], revalidate: 30 }
);

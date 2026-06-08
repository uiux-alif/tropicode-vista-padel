import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { CONTENT_DEFAULTS } from "./content-defaults";

export type ContentMap = Record<string, string>;

// Cached for 60s, busted by revalidateTag("content") when admin saves.
export const getAllContent = unstable_cache(
  async (): Promise<ContentMap> => {
    const map: ContentMap = {};
    for (const [key, def] of Object.entries(CONTENT_DEFAULTS)) {
      map[key] = def.value;
    }
    try {
      const rows = await prisma.siteContent.findMany();
      for (const row of rows) map[row.key] = row.value;
    } catch {
      // DB unavailable — fall back to defaults silently.
    }
    return map;
  },
  ["site-content"],
  { tags: ["content"], revalidate: 60 }
);

export function getContent(map: ContentMap, key: string, fallback = ""): string {
  return map[key] ?? CONTENT_DEFAULTS[key]?.value ?? fallback;
}

export function getJsonContent<T>(map: ContentMap, key: string, fallback: T): T {
  const raw = map[key] ?? CONTENT_DEFAULTS[key]?.value;
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

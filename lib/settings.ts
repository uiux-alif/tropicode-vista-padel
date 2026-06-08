import { prisma } from "./prisma";

export const SETTING_DEFAULTS: Record<string, string> = {
  "booking.lockMinutes": "60",
  "booking.extendMinutes": "30",
  "booking.timezone": "Asia/Jakarta",
  "booking.expiryNotify": "false",
  "site.maintenanceMode": "false",
};

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? SETTING_DEFAULTS[key] ?? "";
  } catch {
    return SETTING_DEFAULTS[key] ?? "";
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  const map = { ...SETTING_DEFAULTS };
  try {
    const rows = await prisma.appSetting.findMany();
    for (const r of rows) map[r.key] = r.value;
  } catch {
    // ignore
  }
  return map;
}

export async function getLockMinutes(): Promise<number> {
  return parseInt(await getSetting("booking.lockMinutes"), 10) || 60;
}

import { NextResponse } from "next/server";
import { buildSchedule } from "@/lib/booking";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? toDateKey(new Date());

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format." }, { status: 400 });
  }

  try {
    const schedule = await buildSchedule(date);
    return NextResponse.json(schedule);
  } catch (err) {
    console.error("schedule error", err);
    return NextResponse.json({ error: "Failed to load schedule." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getCourts } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const courts = await getCourts();
  return NextResponse.json(courts);
}

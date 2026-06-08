import { NextResponse } from "next/server";
import { getCoaches } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCoaches());
}

import { NextResponse } from "next/server";
import { getMembershipPlans } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getMembershipPlans());
}

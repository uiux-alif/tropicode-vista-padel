import { NextResponse } from "next/server";
import { getAllContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keys = searchParams.get("keys");
  const all = await getAllContent();
  if (!keys) return NextResponse.json(all);

  const wanted = keys.split(",").map((k) => k.trim());
  const subset: Record<string, string> = {};
  for (const k of wanted) if (k in all) subset[k] = all[k];
  return NextResponse.json(subset);
}

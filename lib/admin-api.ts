import { NextResponse } from "next/server";
import { getAdminSession } from "./session";

/** Guard for admin route handlers. Returns the session or a 401 response. */
export async function withAdmin<T>(
  handler: (session: { sub: string; email: string }) => Promise<T>
): Promise<T | NextResponse> {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(session);
}

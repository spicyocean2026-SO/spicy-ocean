import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/auth/me — returns the current user from the session cookie.
export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: { username: session.username } });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Ably from "ably";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ably-token — issues a short-lived Ably token to signed-in clients,
// so the browser never sees the root ABLY_API_KEY.
export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const key = process.env.ABLY_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Realtime not configured (ABLY_API_KEY missing)" }, { status: 503 });
  }

  try {
    const client = new Ably.Rest(key);
    const tokenRequest = await client.auth.createTokenRequest({
      clientId: session.username || String(session.sub),
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error("Ably token request failed:", err);
    return NextResponse.json({ error: "Could not create token" }, { status: 500 });
  }
}

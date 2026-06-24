import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession, COOKIE_NAME, type SessionPayload } from "./auth";

// Read + verify the current session from the request cookie (route handlers).
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return verifySession(token);
}

type Guard = { session: SessionPayload } | { response: NextResponse };

/**
 * Guard a route handler. Returns the session, or a 401/403 NextResponse to
 * return early. Pass allowedRoles to restrict to specific roles (default: any
 * authenticated user).
 *
 *   const auth = await requireRole();            // any signed-in user
 *   const auth = await requireRole(["owner"]);   // owner only
 *   if ("response" in auth) return auth.response;
 */
export async function requireRole(allowedRoles?: string[]): Promise<Guard> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (allowedRoles && !allowedRoles.includes((session.role as string) || "owner")) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

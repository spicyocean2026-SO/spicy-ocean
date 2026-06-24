import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";
import { canAccess, defaultPathForRole, Role } from "@/lib/roles";

const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(token);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Signed-in users shouldn't see login/signup — send them to their home page.
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL(defaultPathForRole(session.role as Role), req.url));
  }

  // Everything else requires a session; bounce to login otherwise.
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Signed in: enforce role-based access to app routes.
  if (session && !isAuthPage) {
    const role = session.role as Role | undefined;
    if (!canAccess(role, pathname)) {
      return NextResponse.redirect(new URL(defaultPathForRole(role), req.url));
    }
  }

  return NextResponse.next();
}

// Run on all routes except API, Next internals, and static assets.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|logo.png|kadali-logo.png|placeholder.svg).*)",
  ],
};

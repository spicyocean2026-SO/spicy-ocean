import { NextRequest, NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "@/lib/auth";

const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(token);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  // Signed-in users shouldn't see login/signup — send them to the app.
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Everything else requires a session; bounce to login otherwise.
  if (!session && !isAuthPage) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run on all routes except API, Next internals, and static assets.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|logo.png|kadali-logo.png|placeholder.svg).*)",
  ],
};

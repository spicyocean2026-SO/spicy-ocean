import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { signSession, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/login — verifies credentials and stores a session cookie.
export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { username, password } = parsed.data;

    await connectDB();
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const role = user.role || "owner";
    const token = await signSession({ sub: String(user._id), username: user.username, role });
    const res = NextResponse.json({ user: { username: user.username, role } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return NextResponse.json(
      { error: "Could not sign in. Is MongoDB running?" },
      { status: 500 }
    );
  }
}

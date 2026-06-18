import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const signupSchema = z.object({
  username: z.string().trim().toLowerCase().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  creationPassword: z.string().min(1, "Creation password is required"),
});

// POST /api/auth/signup — creates an account only if the creation password matches.
export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { username, password, creationPassword } = parsed.data;

    const expected = process.env.SIGNUP_CODE;
    if (!expected) {
      return NextResponse.json(
        { error: "Signups are disabled (SIGNUP_CODE not configured)." },
        { status: 503 }
      );
    }
    if (creationPassword !== expected) {
      return NextResponse.json({ error: "Invalid creation password." }, { status: 403 });
    }

    await connectDB();
    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/signup failed:", err);
    return NextResponse.json(
      { error: "Could not create account. Is MongoDB running?" },
      { status: 500 }
    );
  }
}

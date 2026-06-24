import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Profile, DEFAULT_PROFILE } from "@/models/Profile";
import { requireRole } from "@/lib/session";

// Mongoose needs the Node.js runtime, and this data must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: any) {
  return {
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    countryCode: doc.countryCode,
    mobile: doc.mobile,
  };
}

// GET /api/profile — returns the singleton profile, seeding defaults on first use.
export async function GET() {
  try {
    const auth = await requireRole();
    if ("response" in auth) return auth.response;
    await connectDB();
    let doc = await Profile.findOne({ key: "primary" });
    if (!doc) {
      doc = await Profile.create(DEFAULT_PROFILE);
    }
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("GET /api/profile failed:", err);
    return NextResponse.json(
      { error: "Could not load profile. Is MongoDB running and MONGODB_URI set?" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
  countryCode: z.string().trim().min(1).default("+91"),
  mobile: z.string().trim().min(1, "Mobile number is required"),
});

// PUT /api/profile — upserts the singleton profile.
export async function PUT(request: Request) {
  try {
    const auth = await requireRole();
    if ("response" in auth) return auth.response;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();
    const doc = await Profile.findOneAndUpdate(
      { key: "primary" },
      { $set: parsed.data, $setOnInsert: { key: "primary" } },
      { new: true, upsert: true, runValidators: true }
    );
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("PUT /api/profile failed:", err);
    return NextResponse.json(
      { error: "Could not save profile. Is MongoDB running and MONGODB_URI set?" },
      { status: 500 }
    );
  }
}

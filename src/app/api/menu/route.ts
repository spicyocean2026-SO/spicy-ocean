import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import {
  MenuItem,
  DEFAULT_FOOD_ITEMS,
  DEFAULT_TEA_SNACKS_ITEMS,
} from "@/models/MenuItem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: any) {
  return {
    id: String(doc._id),
    name: doc.name,
    price: doc.price,
    category: doc.category,
    kind: doc.kind,
  };
}

// GET /api/menu?kind=FOOD|TEA_SNACKS — list items, seeding defaults on first use.
export async function GET(request: Request) {
  try {
    await connectDB();
    const count = await MenuItem.estimatedDocumentCount();
    if (count === 0) {
      await MenuItem.insertMany([...DEFAULT_FOOD_ITEMS, ...DEFAULT_TEA_SNACKS_ITEMS]);
    }

    const kind = new URL(request.url).searchParams.get("kind");
    const filter: Record<string, unknown> = {};
    if (kind) filter.kind = kind;
    const items = await MenuItem.find(filter as any).sort({ category: 1, name: 1 });
    return NextResponse.json(items.map(serialize));
  } catch (err) {
    console.error("GET /api/menu failed:", err);
    return NextResponse.json({ error: "Could not load menu." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  price: z.number().min(0, "Price must be >= 0"),
  category: z.string().trim().min(1, "Category is required"),
  kind: z.enum(["FOOD", "TEA_SNACKS"]).default("FOOD"),
});

// POST /api/menu — add a menu item.
export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    await connectDB();
    const doc = await MenuItem.create(parsed.data);
    return NextResponse.json(serialize(doc), { status: 201 });
  } catch (err) {
    console.error("POST /api/menu failed:", err);
    return NextResponse.json({ error: "Could not add item." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { MenuItem } from "@/models/MenuItem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: any) {
  return { id: String(doc._id), name: doc.name, price: doc.price, category: doc.category, kind: doc.kind };
}

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  price: z.number().min(0).optional(),
  category: z.string().trim().min(1).optional(),
});

// PATCH /api/menu/[id] — update a menu item.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    await connectDB();
    const doc = await MenuItem.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    if (!doc) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    return NextResponse.json(serialize(doc));
  } catch (err) {
    console.error("PATCH /api/menu/[id] failed:", err);
    return NextResponse.json({ error: "Could not update item." }, { status: 500 });
  }
}

// DELETE /api/menu/[id] — remove a menu item.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const doc = await MenuItem.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: "Item not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/menu/[id] failed:", err);
    return NextResponse.json({ error: "Could not delete item." }, { status: 500 });
  }
}

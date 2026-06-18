import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Order, ITEM_STATUSES, serializeOrder } from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orders/[id] — single order (used by a table to poll its status).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json(serializeOrder(order));
  } catch (err) {
    console.error("GET /api/orders/[id] failed:", err);
    return NextResponse.json({ error: "Could not load order." }, { status: 500 });
  }
}

const patchSchema = z.object({
  // Update specific items' kitchen status.
  itemStatuses: z.array(z.object({ menuItemId: z.string(), status: z.enum(ITEM_STATUSES) })).optional(),
  // Set every item to one status (e.g. mark whole order done).
  allStatus: z.enum(ITEM_STATUSES).optional(),
  // Change quantity / remove (quantity 0 removes the item).
  itemQuantities: z.array(z.object({ menuItemId: z.string(), quantity: z.number().int().min(0) })).optional(),
  paymentStatus: z.enum(["pending", "paid"]).optional(),
});

// PATCH /api/orders/[id] — update item statuses, quantities, or payment.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    await connectDB();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const { itemStatuses, allStatus, itemQuantities, paymentStatus } = parsed.data;

    if (allStatus) {
      order.items.forEach((i: any) => (i.status = allStatus));
    }
    if (itemStatuses) {
      for (const u of itemStatuses) {
        const it = order.items.find((i: any) => i.menuItemId === u.menuItemId);
        if (it) it.status = u.status;
      }
    }
    if (itemQuantities) {
      for (const u of itemQuantities) {
        const it = order.items.find((i: any) => i.menuItemId === u.menuItemId);
        if (it) it.quantity = u.quantity;
      }
      order.items = order.items.filter((i: any) => i.quantity > 0) as any;
    }
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();
    return NextResponse.json(serializeOrder(order));
  } catch (err) {
    console.error("PATCH /api/orders/[id] failed:", err);
    return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  }
}

// DELETE /api/orders/[id] — clear the order from active lists (soft, keeps record).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();
    const order = await Order.findByIdAndUpdate(id, { $set: { status: "cleared" } }, { new: true });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/orders/[id] failed:", err);
    return NextResponse.json({ error: "Could not clear order." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { Order, makeOrderNo, serializeOrder } from "@/models/Order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/orders?active=1&type=DINE_IN&table=1 — list orders (active by default).
export async function GET(request: Request) {
  try {
    await connectDB();
    const sp = new URL(request.url).searchParams;
    const filter: Record<string, unknown> = {};
    if (sp.get("active") !== "0") filter.status = "active";
    const type = sp.get("type");
    if (type) filter.type = type;
    const table = sp.get("table");
    if (table) filter.tableNumber = Number(table);

    const orders = await Order.find(filter as any).sort({ createdAt: 1 });
    return NextResponse.json(orders.map(serializeOrder));
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }
}

const createSchema = z.object({
  type: z.enum(["DINE_IN", "TAKE_AWAY", "TEA_SNACKS"]),
  tableNumber: z.number().int().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().min(0),
        category: z.string().optional(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Add at least one item"),
});

// POST /api/orders — "Send to Kitchen". Creates an order, or appends to the
// table's existing active dine-in order so a table has a single running bill.
export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { type, tableNumber = 0, items } = parsed.data;
    await connectDB();

    let order = null;
    if (type === "DINE_IN" && tableNumber > 0) {
      order = await Order.findOne({ type: "DINE_IN", tableNumber, status: "active" });
    }

    if (order) {
      // Merge into the running order (increment existing items, add new ones).
      for (const incoming of items) {
        const existing = order.items.find((i: any) => i.menuItemId === incoming.menuItemId);
        if (existing) existing.quantity += incoming.quantity;
        else order.items.push({ ...incoming, status: "added" } as any);
      }
      await order.save();
    } else {
      order = await Order.create({
        orderNo: makeOrderNo(type),
        type,
        tableNumber,
        items: items.map((i) => ({ ...i, status: "added" })),
      });
    }

    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    return NextResponse.json({ error: "Could not create order." }, { status: 500 });
  }
}

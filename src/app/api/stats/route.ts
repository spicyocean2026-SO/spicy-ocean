import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireRole } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/stats?from=<ISO> — sales analytics over completed (billed/cleared)
// orders since `from`. Owner-only. Revenue figures are pre-tax; the client
// applies the configured tax rate. `from` is computed by the client in its
// local timezone so day/week/month boundaries are correct.
export async function GET(request: Request) {
  try {
    const auth = await requireRole(["owner"]);
    if ("response" in auth) return auth.response;

    const fromParam = new URL(request.url).searchParams.get("from");
    const from = fromParam ? new Date(fromParam) : new Date(0);

    await connectDB();
    const orders = await Order.find({ status: "cleared", createdAt: { $gte: from } })
      .select("items createdAt")
      .lean();

    let revenue = 0;
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const points: { t: string; revenue: number }[] = [];

    for (const o of orders as any[]) {
      let orderTotal = 0;
      for (const it of o.items ?? []) {
        const line = it.price * it.quantity;
        orderTotal += line;
        const entry = itemMap.get(it.name) ?? { name: it.name, quantity: 0, revenue: 0 };
        entry.quantity += it.quantity;
        entry.revenue += line;
        itemMap.set(it.name, entry);
      }
      revenue += orderTotal;
      points.push({ t: new Date(o.createdAt).toISOString(), revenue: orderTotal });
    }

    const itemsSold = Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);

    return NextResponse.json({
      totalOrders: orders.length,
      revenue,
      topItem: itemsSold[0] ?? null,
      itemsSold,
      points,
    });
  } catch (err) {
    console.error("GET /api/stats failed:", err);
    return NextResponse.json({ error: "Could not load statistics." }, { status: 500 });
  }
}

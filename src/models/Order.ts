import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

export const ITEM_STATUSES = ["added", "cooking", "ready", "completed"] as const;
export const ORDER_TYPES = ["DINE_IN", "TAKE_AWAY", "TEA_SNACKS"] as const;

const OrderItemSchema = new Schema(
  {
    menuItemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ITEM_STATUSES, default: "added" },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    type: { type: String, enum: ORDER_TYPES, required: true },
    tableNumber: { type: Number, default: 0 }, // 0 for non dine-in
    items: { type: [OrderItemSchema], default: [] },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    // active = visible in kitchen/counter; cleared = settled/removed from active lists.
    status: { type: String, enum: ["active", "cleared"], default: "active", index: true },
    // Server freed the table (available for new orders) but the order is still
    // open and awaiting the cashier to bill/settle it.
    tableFreed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type OrderDoc = InferSchemaType<typeof OrderSchema>;

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc>) ||
  mongoose.model<OrderDoc>("Order", OrderSchema);

const PREFIX: Record<string, string> = {
  DINE_IN: "DIN",
  TAKE_AWAY: "TAKE",
  TEA_SNACKS: "TS",
};

// Human-readable, collision-resistant order number, e.g. DIN-LR4F-7T.
export function makeOrderNo(type: string): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${PREFIX[type] ?? "ORD"}-${rand}`;
}

// Serialize a Mongo order doc into the shape the client/UI expects.
export function serializeOrder(doc: any) {
  return {
    orderId: String(doc._id),
    orderNo: doc.orderNo,
    type: doc.type,
    tableNumber: doc.tableNumber,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
    tableFreed: !!doc.tableFreed,
    createdAt: doc.createdAt,
    items: (doc.items ?? []).map((i: any) => ({
      menuItem: {
        id: i.menuItemId,
        name: i.name,
        price: i.price,
        category: i.category ?? "",
      },
      quantity: i.quantity,
      status: i.status,
    })),
  };
}

import Ably from "ably";

export const ORDERS_CHANNEL = "orders";

let rest: Ably.Rest | null = null;

function getRest(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null; // Ably not configured -> realtime disabled (app still works)
  if (!rest) rest = new Ably.Rest(key);
  return rest;
}

/**
 * Publish an "orders changed" event so connected clients refetch immediately.
 * No-op (and never throws) if Ably isn't configured or publishing fails.
 */
export async function publishOrdersChanged(payload?: Record<string, unknown>): Promise<void> {
  const client = getRest();
  if (!client) return;
  try {
    await client.channels.get(ORDERS_CHANNEL).publish("changed", payload ?? {});
  } catch (err) {
    console.error("Ably publish failed:", err);
  }
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import { getCartItemCount, getCartSummaryForUser } from "@/lib/db/cart-count";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const cart = await getCartSummaryForUser(userId);

  if (!cart) {
    return NextResponse.json({ count: 0 });
  }

  const expired = await clearCartIfExpired(cart);
  if (expired) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getCartItemCount(cart.id);

  return NextResponse.json({ count });
}

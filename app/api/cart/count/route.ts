import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true, updatedAt: true }
  });

  if (!cart) {
    return NextResponse.json({ count: 0 });
  }

  const expired = await clearCartIfExpired(cart);
  if (expired) {
    return NextResponse.json({ count: 0 });
  }

  const result = await prisma.cartItem.aggregate({
    where: { cartId: cart.id },
    _sum: { qty: true }
  });

  return NextResponse.json({ count: result._sum.qty ?? 0 });
}

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ count: 0, total: "0", items: [] }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  if (!cart) {
    return NextResponse.json({ count: 0, total: "0", items: [] });
  }

  const expired = await clearCartIfExpired(cart);
  if (expired) {
    return NextResponse.json({ count: 0, total: "0", items: [] });
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    partStkNo: item.partStkNo,
    description: item.description,
    qty: item.qty,
    unitPrice: item.unitPrice.toString(),
    lineTotal: item.lineTotal.toString()
  }));

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.items
    .reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0))
    .toString();

  return NextResponse.json({ count, total, items });
}

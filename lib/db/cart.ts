import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { clearCartIfExpired } from "@/lib/cart-expiry";

type CartItemSummary = {
  id: string;
  partStkNo: string;
  description: string | null;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type CartSummaryResult = {
  count: number;
  total: string;
  items: CartItemSummary[];
};

export async function getCartSummaryForUser(userId: string): Promise<CartSummaryResult> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  if (!cart) {
    return { count: 0, total: "0", items: [] };
  }

  const expired = await clearCartIfExpired(cart);
  if (expired) {
    return { count: 0, total: "0", items: [] };
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

  return { count, total, items };
}

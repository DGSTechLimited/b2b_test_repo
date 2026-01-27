import { updateCartItem } from "@/app/actions/portal";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import { CartClient } from "./CartClient";

export default async function CartPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const expired = await clearCartIfExpired(cart);
  const items = expired ? [] : cart?.items ?? [];
  const total = items.reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));

  const itemRows = items.map((item) => ({
    id: item.id,
    partStkNo: item.partStkNo,
    description: item.description,
    qty: item.qty,
    lineTotal: item.lineTotal.toString()
  }));

  return (
    <CartClient
      items={itemRows}
      total={total.toString()}
      onUpdateCartItem={updateCartItem}
    />
  );
}

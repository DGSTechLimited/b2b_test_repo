import { prisma } from "@/lib/db/prisma";

export async function clearExpiredCart(cartId: string) {
  // LLID: L-LIB-002-clear-expired-cart-items
  await prisma.cartItem.deleteMany({ where: { cartId } });
  // LLID: L-LIB-003-touch-expired-cart
  await prisma.cart.update({
    where: { id: cartId },
    data: { updatedAt: new Date() }
  });
}

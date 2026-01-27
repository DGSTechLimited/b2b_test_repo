import { prisma } from "@/lib/prisma";

const CART_RETENTION_MS = 72 * 60 * 60 * 1000;

export function isCartExpired(updatedAt: Date) {
  return Date.now() - updatedAt.getTime() > CART_RETENTION_MS;
}

export async function clearCartIfExpired(cart: { id: string; updatedAt: Date } | null) {
  if (!cart) {
    return false;
  }
  if (!isCartExpired(cart.updatedAt)) {
    return false;
  }
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() }
  });
  return true;
}

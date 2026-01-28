import { prisma } from "@/lib/db/prisma";

export async function getCartSummaryForUser(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    select: { id: true, updatedAt: true }
  });
}

export async function getCartItemCount(cartId: string) {
  const result = await prisma.cartItem.aggregate({
    where: { cartId },
    _sum: { qty: true }
  });
  return result._sum.qty ?? 0;
}

import { prisma } from "@/lib/db/prisma";

export async function getCartWithItemsByUserId(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });
}

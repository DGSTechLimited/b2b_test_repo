import { prisma } from "@/lib/db/prisma";

export async function getOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getOrderDetailForUser(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true }
  });
}

export async function getLineStatusesForOrder(orderId: string) {
  return prisma.orderLineStatus.findMany({
    where: { orderId }
  });
}

export async function getAdminHoldOrders() {
  return prisma.order.findMany({
    where: { status: { in: ["ON_HOLD", "SUSPENDED"] } },
    include: {
      items: true,
      lineStatuses: true,
      user: {
        select: {
          name: true,
          email: true,
          dealerProfile: { select: { dealerName: true, accountNo: true } }
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });
}

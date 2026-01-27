import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { OrdersClient } from "./OrdersClient";

export default async function OrdersPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const orderRows = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    createdAtLabel: order.createdAt.toLocaleDateString(),
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    totalAmount: order.totalAmount.toString()
  }));

  return <OrdersClient orders={orderRows} />;
}

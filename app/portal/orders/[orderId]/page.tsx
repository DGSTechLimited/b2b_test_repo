import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, userId },
    include: { items: true }
  });

  if (!order) {
    notFound();
  }

  const lineStatuses = await prisma.orderLineStatus.findMany({
    where: { orderId: order.id }
  });
  const statusMap = new Map(
    lineStatuses.map((status) => [status.partNumber, status.status])
  );

  const itemRows = order.items.map((item) => ({
    id: item.id,
    partStkNo: item.partStkNo,
    description: item.description,
    status: statusMap.get(item.partStkNo) ?? item.status,
    trackingNo: item.trackingNo,
    qty: item.qty,
    lineTotal: item.lineTotal.toString()
  }));

  return (
    <OrderDetailClient
      orderId={order.id}
      orderNumber={order.orderNumber}
      status={order.status}
      items={itemRows}
    />
  );
}

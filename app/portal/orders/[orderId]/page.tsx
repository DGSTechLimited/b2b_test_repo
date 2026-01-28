import { notFound } from "next/navigation";
import { requireRole } from "@/lib/require-auth";
import { getLineStatusesForOrder, getOrderDetailForUser } from "@/lib/db/orders";
import { OrderDetailClient } from "./OrderDetailClient";

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;

  const order = await getOrderDetailForUser(userId, params.orderId);

  if (!order) {
    notFound();
  }

  const lineStatuses = await getLineStatusesForOrder(order.id);
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

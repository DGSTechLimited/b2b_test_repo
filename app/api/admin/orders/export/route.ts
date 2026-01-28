import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { requireRole } from "@/lib/require-auth";
import { getAdminHoldOrders } from "@/lib/db/orders";

export async function GET() {
  try {
    await requireRole("ADMIN");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const orders = await getAdminHoldOrders();

  const rows = orders.flatMap((order) => {
    const dealerName =
      order.user.dealerProfile?.dealerName ?? order.user.name ?? order.user.email ?? "Unknown";
    const accountNo = order.user.dealerProfile?.accountNo ?? order.dealerAccountNo;
    const lineStatusMap = new Map(
      order.lineStatuses.map((row) => [`${row.partNumber}`, row])
    );

    return order.items.map((item, index) => {
      const lineStatus = lineStatusMap.get(item.partStkNo);
      const fulfilledQty = lineStatus?.fulfilledQty ?? item.shippedQty ?? "";
      const backorderedQty = lineStatus?.backorderedQty ?? item.backorderedQty ?? "";
      const status = lineStatus?.status ?? item.status ?? order.status;

      return {
        dealer_name: dealerName,
        dealer_account_no: accountNo,
        order_number: order.orderNumber,
        order_created_at: order.createdAt.toISOString(),
        line_number: index + 1,
        part_number: item.partStkNo,
        description: item.description ?? "",
        qty_ordered: item.qty,
        qty_fulfilled: fulfilledQty === null ? "" : fulfilledQty,
        qty_backordered: backorderedQty === null ? "" : backorderedQty,
        unit_price: item.unitPrice.toString(),
        line_total: item.lineTotal.toString(),
        status
      };
    });
  });

  // CSV headers: dealer_name,dealer_account_no,order_number,order_created_at,line_number,part_number,description,qty_ordered,qty_fulfilled,qty_backordered,unit_price,line_total,status
  const csv = stringify(rows, { header: true });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=order-export.csv"
    }
  });
}

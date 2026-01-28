import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { requireRole } from "@/lib/require-auth";
import { getBackorderExportRows, getDealerAccountNoByUserId } from "@/lib/db/backorders";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const accountNo = await getDealerAccountNoByUserId(userId);
  if (!accountNo) {
    return new NextResponse("Dealer not found", { status: 404 });
  }

  const rows = await getBackorderExportRows(accountNo);

  const csvRows = rows.map((row) => ({
    "Portal Order Number": row.order.orderNumber,
    "ERP Order Number": "",
    "Product Code": row.partNumber,
    Description:
      row.order.items.find((item) => item.partStkNo === row.partNumber)?.description ?? "",
    "Quantity Ordered": row.orderedQty,
    "Quantity Outstanding":
      row.backorderedQty ?? Math.max(0, row.orderedQty - (row.fulfilledQty ?? 0)),
    "In Warehouse": row.fulfilledQty ?? ""
  }));

  const csv = stringify(csvRows, { header: true });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=order_status.csv"
    }
  });
}

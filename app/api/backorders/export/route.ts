import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

export async function GET() {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const dealerProfile = await prisma.dealerProfile.findUnique({ where: { userId } });

  if (!dealerProfile) {
    return new NextResponse("Dealer not found", { status: 404 });
  }

  const rows = await prisma.orderLineStatus.findMany({
    where: { accountNo: dealerProfile.accountNo },
    orderBy: { statusDate: "desc" },
    include: {
      order: {
        select: {
          orderNumber: true,
          items: { select: { partStkNo: true, description: true } }
        }
      }
    }
  });

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

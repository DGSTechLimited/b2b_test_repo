import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { listOrderLineStatuses } from "@/lib/db/admin-uploads";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const [total, statuses] = await listOrderLineStatuses(page, pageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    data: statuses.map((row) => ({
      id: row.id,
      accountNo: row.accountNo,
      orderNumber: row.order.orderNumber,
      partNumber: row.partNumber,
      orderedQty: row.orderedQty,
      fulfilledQty: row.fulfilledQty,
      backorderedQty: row.backorderedQty,
      status: row.status,
      statusDate: row.statusDate.toISOString()
    })),
    page,
    pageSize,
    total,
    totalPages
  });
}

import { NextResponse } from "next/server";
import { stringify } from "csv-stringify/sync";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/require-auth";
import { getOrdersForUser } from "@/lib/db/orders";

export async function GET(request: Request) {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  if (format !== "csv" && format !== "xlsx") {
    return NextResponse.json({ message: "Invalid format" }, { status: 400 });
  }

  const userId = (session.user as any).id as string;
  const orders = await getOrdersForUser(userId);

  const rows = orders.map((order) => ({
    "Portal Order Number": order.orderNumber,
    Status: order.status,
    Date: order.createdAt.toISOString(),
    Total: order.totalAmount.toString(),
    "ERP Order Number": ""
  }));

  if (format === "csv") {
    const csv = stringify(rows, { header: true });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=orders.csv"
      }
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=orders.xlsx"
    }
  });
}

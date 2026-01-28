import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { getAdminOrders } from "@/lib/db/admin-orders";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const status = (searchParams.get("status") ?? "PENDING").toUpperCase();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const result = await getAdminOrders({ query, status, page, pageSize });
  return NextResponse.json(result);
}

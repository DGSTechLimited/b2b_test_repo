import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { listCatalogPartsByType } from "@/lib/db/admin-uploads";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "AFTERMARKET";
  if (type !== "AFTERMARKET" && type !== "GENUINE" && type !== "BRANDED") {
    return NextResponse.json({ message: "Invalid part type" }, { status: 400 });
  }

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const [total, parts] = await listCatalogPartsByType(type, page, pageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    data: parts.map((part) => ({
      id: part.id,
      stkNo: part.stkNo,
      description: part.description,
      supplier: part.supplier,
      brand: part.brand,
      freeStock: part.freeStock,
      bandA: part.bandA.toString(),
      bandB: part.bandB.toString(),
      bandC: part.bandC.toString(),
      bandD: part.bandD.toString(),
      bandE: part.bandE.toString(),
      bandF: part.bandF.toString(),
      isActive: part.isActive
    })),
    page,
    pageSize,
    total,
    totalPages
  });
}

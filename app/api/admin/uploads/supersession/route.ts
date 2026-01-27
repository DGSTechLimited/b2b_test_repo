import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const [total, supersessions] = await Promise.all([
    prisma.supersession.count(),
    prisma.supersession.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const now = new Date();

  return NextResponse.json({
    data: supersessions.map((row) => ({
      id: row.id,
      oldPartNo: row.oldPartNo,
      newPartNo: row.newPartNo,
      effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString() : null,
      status: row.effectiveDate && row.effectiveDate > now ? "Pending" : "Active"
    })),
    page,
    pageSize,
    total,
    totalPages
  });
}

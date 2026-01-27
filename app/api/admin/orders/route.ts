import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

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

  const where: Prisma.OrderWhereInput = {};
  if (status !== "ALL") {
    if (status === "PENDING") {
      where.status = { in: ["ON_HOLD", "SUSPENDED"] };
    } else {
      where.status = status as Prisma.OrderWhereInput["status"];
    }
  }

  if (query) {
    where.OR = [
      { orderNumber: { contains: query, mode: "insensitive" } },
      { dealerAccountNo: { contains: query, mode: "insensitive" } },
      { user: { name: { contains: query, mode: "insensitive" } } },
      { user: { email: { contains: query, mode: "insensitive" } } },
      { user: { dealerProfile: { dealerName: { contains: query, mode: "insensitive" } } } }
    ];
  }

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            dealerProfile: { select: { dealerName: true } }
          }
        },
        _count: { select: { items: true } }
      }
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    data: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      dealerAccountNo: order.dealerAccountNo,
      dealerName:
        order.user.dealerProfile?.dealerName ??
        order.user.name ??
        order.user.email ??
        "Unknown",
      itemCount: order._count.items,
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    })),
    page,
    pageSize,
    total,
    totalPages
  });
}

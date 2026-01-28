import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

type AdminOrderRow = {
  id: string;
  orderNumber: string;
  dealerAccountNo: string | null;
  dealerName: string;
  itemCount: number;
  totalAmount: string;
  currency: string;
  status: string;
  createdAt: string;
};

type AdminOrderResult = {
  data: AdminOrderRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function getAdminOrders(params: {
  query: string;
  status: string;
  page: number;
  pageSize: number;
}): Promise<AdminOrderResult> {
  const { query, status, page, pageSize } = params;
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

  return {
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
  };
}

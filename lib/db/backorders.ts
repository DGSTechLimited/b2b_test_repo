import { prisma } from "@/lib/db/prisma";

export async function getDealerAccountNoByUserId(userId: string) {
  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId },
    select: { accountNo: true }
  });
  return dealerProfile?.accountNo ?? null;
}

export async function getBackordersForAccount(accountNo: string) {
  return prisma.orderLineStatus.findMany({
    where: { accountNo, backorderedQty: { gt: 0 } },
    orderBy: { statusDate: "desc" },
    take: 20,
    include: {
      order: {
        select: {
          orderNumber: true,
          items: { select: { partStkNo: true, description: true, unitPrice: true } }
        }
      }
    }
  });
}

export async function getBackorderExportRows(accountNo: string) {
  return prisma.orderLineStatus.findMany({
    where: { accountNo },
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
}

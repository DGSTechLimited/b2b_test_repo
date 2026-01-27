import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { BackordersClient } from "./BackordersClient";

export default async function BackordersPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const dealerProfile = await prisma.dealerProfile.findUnique({ where: { userId } });

  if (!dealerProfile) {
    throw new Error("Dealer profile not found.");
  }

  const backorders = await prisma.orderLineStatus.findMany({
    where: {
      accountNo: dealerProfile.accountNo,
      backorderedQty: { gt: 0 }
    },
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

  const backorderRows = backorders.map((row) => {
    const item = row.order.items.find((orderItem) => orderItem.partStkNo === row.partNumber);
    const lineValue =
      item && row.backorderedQty
        ? item.unitPrice.mul(row.backorderedQty).toString()
        : null;
    return {
      id: row.id,
      part: row.partNumber,
      description: item?.description ?? null,
      yourOrderNo: row.order.orderNumber,
      qOrd: row.orderedQty,
      lineValue
    };
  });

  return <BackordersClient backorders={backorderRows} />;
}

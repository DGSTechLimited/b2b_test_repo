import { requireRole } from "@/lib/require-auth";
import { getBackordersForAccount, getDealerAccountNoByUserId } from "@/lib/db/backorders";
import { BackordersClient } from "./BackordersClient";

export default async function BackordersPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const accountNo = await getDealerAccountNoByUserId(userId);

  if (!accountNo) {
    throw new Error("Dealer profile not found.");
  }

  const backorders = await getBackordersForAccount(accountNo);

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

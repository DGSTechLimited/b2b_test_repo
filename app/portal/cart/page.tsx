import { updateCartItem } from "@/app/actions/portal";
import { requireRole } from "@/lib/require-auth";
import { getCartPageData } from "@/lib/db/portal-pages";
import { CartClient } from "./CartClient";

export default async function CartPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;

  const { items: itemRows, total } = await getCartPageData(userId);

  return (
    <CartClient
      items={itemRows}
      total={total}
      onUpdateCartItem={updateCartItem}
    />
  );
}

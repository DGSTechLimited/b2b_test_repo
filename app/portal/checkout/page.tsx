import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import { CheckoutClient } from "./CheckoutClient";

function splitName(fullName: string) {
  const parts = fullName.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default async function CheckoutPage() {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const userName = String((session.user as any).name ?? "");
  const userEmail = String(session.user?.email ?? "");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const expired = await clearCartIfExpired(cart);
  const items = expired ? [] : cart?.items ?? [];
  if (items.length === 0) {
    redirect("/portal/cart?notice=empty");
  }
  const total = items.reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));

  const itemRows = items.map((item) => ({
    id: item.id,
    partStkNo: item.partStkNo,
    qty: item.qty,
    lineTotal: item.lineTotal.toString()
  }));

  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId }
  });
  const { firstName, lastName } = splitName(userName);

  return (
    <CheckoutClient
      items={itemRows}
      total={total.toString()}
      defaultFirstName={firstName}
      defaultLastName={lastName}
      defaultEmail={userEmail}
      defaultShippingMethod={dealerProfile?.dispatchMethodDefault ?? ""}
    />
  );
}

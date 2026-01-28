import { redirect } from "next/navigation";
import { requireRole } from "@/lib/require-auth";
import { getCheckoutPageData } from "@/lib/db/portal-pages";
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

  const { items, total, defaultShippingMethod, isEmpty } = await getCheckoutPageData(userId);
  if (isEmpty) {
    redirect("/portal/cart?notice=empty");
  }
  const { firstName, lastName } = splitName(userName);

  return (
    <CheckoutClient
      items={items}
      total={total}
      defaultFirstName={firstName}
      defaultLastName={lastName}
      defaultEmail={userEmail}
      defaultShippingMethod={defaultShippingMethod}
    />
  );
}

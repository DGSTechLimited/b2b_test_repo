"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/require-auth";
import { addToCartDb, placeOrderDb, updateCartItemDb } from "@/lib/db/portal-actions";
import type { CartSummary } from "@/types/cart";

export async function addToCart(formData: FormData): Promise<CartSummary> {
  const session = await requireRole("DEALER");
  const partId = String(formData.get("partId") || "");
  const qty = Number(formData.get("qty") || 1);

  if (!partId || Number.isNaN(qty) || qty <= 0) {
    throw new Error("Invalid cart request.");
  }

  const userId = (session.user as any).id as string;
  const summary = await addToCartDb({ userId, partId, qty });
  revalidatePath("/portal");
  return summary;
}

export async function updateCartItem(formData: FormData): Promise<CartSummary> {
  const session = await requireRole("DEALER");
  const removeItem = String(formData.get("removeItem") || "");
  const itemId = removeItem || String(formData.get("itemId") || "");
  const qty = removeItem ? 0 : Number(formData.get("qty") || 0);

  if (!itemId) {
    throw new Error("Item not found.");
  }

  const userId = (session.user as any).id as string;
  const summary = await updateCartItemDb({ userId, itemId, qty });
  revalidatePath("/portal");
  return summary;
}

export type PlaceOrderInput = {
  firstName: string;
  lastName: string;
  email: string;
  shippingMethod: string;
  poNumber?: string | null;
  orderNote?: string | null;
  saveDefaultShipping?: boolean;
};

export async function placeOrder(input: PlaceOrderInput) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const result = await placeOrderDb({ userId, input });
  revalidatePath("/portal");
  return result;
}

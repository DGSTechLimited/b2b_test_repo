"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { generateOrderNumber } from "@/lib/order-number";
import { resolveTierForCategory, resolveUnitPrice } from "@/lib/pricing";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import type { CartSummary } from "@/types/cart";

async function getCartSummary(userId: string): Promise<CartSummary> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0));

  return {
    items: items.map((item) => ({
      id: item.id,
      partStkNo: item.partStkNo,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString()
    })),
    total: total.toString()
  };
}

export async function addToCart(formData: FormData): Promise<CartSummary> {
  const session = await requireRole("DEALER");
  const partId = String(formData.get("partId") || "");
  const qty = Number(formData.get("qty") || 1);

  if (!partId || Number.isNaN(qty) || qty <= 0) {
    throw new Error("Invalid cart request.");
  }

  const userId = (session.user as any).id as string;
  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId }
  });

  if (!dealerProfile) {
    throw new Error("Dealer profile not found.");
  }

  const part = await prisma.catalogPart.findUnique({ where: { id: partId } });
  if (!part) {
    throw new Error("Part not found.");
  }
  if (!part.isActive) {
    throw new Error("Part is inactive.");
  }

  const { unitPrice } = resolveUnitPrice(part, {
    genuineTier: dealerProfile.genuineTier,
    aftermarketTier: dealerProfile.aftermarketTier,
    brandedTier: dealerProfile.brandedTier
  });
  const lineTotal = unitPrice.mul(qty);

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    // LLID: L-PORTAL-001-create-cart
    cart = await prisma.cart.create({ data: { userId } });
  }

  await clearCartIfExpired(cart);

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, partId }
  });

  if (existing) {
    const newQty = existing.qty + qty;
    // LLID: L-PORTAL-002-update-cart-item
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: {
        qty: newQty,
        lineTotal: unitPrice.mul(newQty)
      }
    });
  } else {
    // LLID: L-PORTAL-003-create-cart-item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        partId: part.id,
        partStkNo: part.stkNo,
        description: part.description,
        qty,
        unitPrice,
        lineTotal
      }
    });
  }

  // LLID: L-PORTAL-004-touch-cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() }
  });

  revalidatePath("/portal");
  return getCartSummary(userId);
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
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    throw new Error("Cart not found.");
  }

  const expired = await clearCartIfExpired(cart);
  if (expired) {
    revalidatePath("/portal");
    return getCartSummary(userId);
  }

  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) {
    throw new Error("Item not found.");
  }

  if (qty <= 0) {
    // LLID: L-PORTAL-005-delete-cart-item
    await prisma.cartItem.delete({ where: { id: itemId } });
    // LLID: L-PORTAL-006-touch-cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: { updatedAt: new Date() }
    });
    revalidatePath("/portal");
    return getCartSummary(userId);
  }

  const lineTotal = item.unitPrice.mul(qty);
  // LLID: L-PORTAL-007-update-cart-item
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { qty, lineTotal }
  });
  // LLID: L-PORTAL-008-touch-cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() }
  });

  // LLID: L-PORTAL-009-audit-cart-update
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "cart.update",
      metadata: { itemId, qty }
    }
  });

  revalidatePath("/portal");
  return getCartSummary(userId);
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
  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId }
  });

  if (!dealerProfile) {
    throw new Error("Dealer profile not found.");
  }

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const expired = await clearCartIfExpired(cart);
  if (!cart || expired || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  let orderNumber = generateOrderNumber();
  let exists = await prisma.order.findUnique({ where: { orderNumber } });
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await prisma.order.findUnique({ where: { orderNumber } });
  }

  const totalAmount = cart.items.reduce(
    (sum, item) => sum.add(item.lineTotal),
    new Prisma.Decimal(0)
  );

  const parts = await prisma.catalogPart.findMany({
    where: { id: { in: cart.items.map((item) => item.partId).filter(Boolean) as string[] } }
  });
  const partMap = new Map(parts.map((part) => [part.id, part]));

  // LLID: L-PORTAL-010-create-order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      dealerAccountNo: dealerProfile.accountNo,
      shippingMethod: input.shippingMethod.trim(),
      poNumber: input.poNumber?.trim() || null,
      orderNote: input.orderNote?.trim() || null,
      contactFirstName: input.firstName.trim(),
      contactLastName: input.lastName.trim(),
      contactEmail: input.email.trim(),
      status: "ON_HOLD",
      totalAmount,
      items: {
        create: cart.items.map((item) => ({
          partId: item.partId,
          partStkNo: item.partStkNo,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          priceCategory: partMap.get(item.partId ?? "")?.partType ?? "AFTERMARKET",
          priceTier: partMap.get(item.partId ?? "")
            ? resolveTierForCategory(
                {
                  genuineTier: dealerProfile.genuineTier,
                  aftermarketTier: dealerProfile.aftermarketTier,
                  brandedTier: dealerProfile.brandedTier
                },
                partMap.get(item.partId ?? "")!.partType
              )
            : dealerProfile.aftermarketTier
        }))
      }
    }
  });

  // LLID: L-PORTAL-011-clear-cart-items
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  // LLID: L-PORTAL-012-touch-cart
  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() }
  });

  if (input.saveDefaultShipping) {
    // LLID: L-PORTAL-013-update-shipping-default
    await prisma.dealerProfile.update({
      where: { id: dealerProfile.id },
      data: { dispatchMethodDefault: input.shippingMethod.trim() }
    });
  }

  // LLID: L-PORTAL-014-audit-order-create
  await prisma.auditLog.create({
    data: {
      userId,
      action: "order.create",
      metadata: { orderNumber, shippingMethod: input.shippingMethod }
    }
  });

  revalidatePath("/portal");

  return { orderId: order.id };
}

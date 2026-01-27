import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { clearCartIfExpired } from "@/lib/cart-expiry";
import { addToCart, updateCartItem } from "@/app/actions/portal";
import { PartsClient } from "./PartsClient";

const tierFieldMap = {
  A: "bandA",
  B: "bandB",
  C: "bandC",
  D: "bandD",
  E: "bandE",
  F: "bandF"
} as const;

const ENABLE_SEARCH_FILTERS = false;
const ENABLE_PRICING_FILTERS = false;

export default async function PartsPage({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const dealerProfile = await prisma.dealerProfile.findUnique({ where: { userId } });

  if (!dealerProfile) {
    throw new Error("Dealer profile missing.");
  }

  const q = (searchParams.q as string) || "";
  const manufacturer = ENABLE_SEARCH_FILTERS ? (searchParams.manufacturer as string) || "" : "";
  const supplier = ENABLE_SEARCH_FILTERS ? (searchParams.supplier as string) || "" : "";
  const brand = ENABLE_SEARCH_FILTERS ? (searchParams.brand as string) || "" : "";
  const oem = ENABLE_SEARCH_FILTERS ? (searchParams.oem as string) || "" : "";
  const partType = (searchParams.partType as string) || "";
  const rawPriceMin = ENABLE_PRICING_FILTERS && searchParams.priceMin
    ? Number(searchParams.priceMin)
    : null;
  const rawPriceMax = ENABLE_PRICING_FILTERS && searchParams.priceMax
    ? Number(searchParams.priceMax)
    : null;
  const priceMin =
    rawPriceMin !== null && !Number.isNaN(rawPriceMin) ? rawPriceMin : null;
  const priceMax =
    rawPriceMax !== null && !Number.isNaN(rawPriceMax) ? rawPriceMax : null;

  const tiers = {
    genuineTier: dealerProfile.genuineTier,
    aftermarketTier: dealerProfile.aftermarketTier,
    brandedTier: dealerProfile.brandedTier
  };
  const where: any = { isActive: true };

  if (q) {
    where.OR = [
      { stkNo: { contains: q, mode: "insensitive" } },
      { landRoverNo: { contains: q, mode: "insensitive" } },
      { jaguarNo: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { barcode: { contains: q, mode: "insensitive" } }
    ];
  }

  if (manufacturer) {
    where.manufacturer = { contains: manufacturer, mode: "insensitive" };
  }
  if (supplier) {
    where.supplier = { contains: supplier, mode: "insensitive" };
  }
  if (brand) {
    where.brand = { contains: brand, mode: "insensitive" };
  }
  if (oem) {
    where.oem = { contains: oem, mode: "insensitive" };
  }
  if (priceMin !== null || priceMax !== null) {
    const priceCondition = {
      ...(priceMin !== null ? { gte: priceMin } : {}),
      ...(priceMax !== null ? { lte: priceMax } : {})
    };
    if (partType === "AFTERMARKET" || partType === "GENUINE" || partType === "BRANDED") {
      const tier =
        partType === "GENUINE"
          ? tiers.genuineTier
          : partType === "AFTERMARKET"
            ? tiers.aftermarketTier
            : tiers.brandedTier;
      where[tierFieldMap[tier]] = priceCondition;
    } else {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { partType: "GENUINE", [tierFieldMap[tiers.genuineTier]]: priceCondition },
            { partType: "AFTERMARKET", [tierFieldMap[tiers.aftermarketTier]]: priceCondition },
            { partType: "BRANDED", [tierFieldMap[tiers.brandedTier]]: priceCondition }
          ]
        }
      ];
    }
  }

  const parts = await prisma.catalogPart.findMany({
    where,
    orderBy: [{ manufacturer: "asc" }, { stkNo: "asc" }],
    take: 60
  });

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });
  const expired = await clearCartIfExpired(cart);
  const cartItems = expired ? [] : cart?.items ?? [];
  const cartTotal = cartItems.reduce(
    (sum, item) => sum.add(item.lineTotal),
    new Prisma.Decimal(0)
  );

  const partRows = parts.map((part) => ({
    id: part.id,
    manufacturer: part.manufacturer,
    partType: part.partType,
    stkNo: part.stkNo,
    description: part.description,
    oem: part.oem,
    supplier: part.supplier,
    barcode: part.barcode,
    freeStock: part.freeStock,
    minimumPrice: part.minimumPrice.toString(),
    bandA: part.bandA.toString(),
    bandB: part.bandB.toString(),
    bandC: part.bandC.toString(),
    bandD: part.bandD.toString(),
    bandE: part.bandE.toString(),
    bandF: part.bandF.toString()
  }));

  return (
    <PartsClient
      dealerTiers={tiers}
      parts={partRows}
      filters={{
        q,
        manufacturer,
        supplier,
        brand,
        oem,
        partType,
        priceMin,
        priceMax
      }}
      initialCart={{
        items: cartItems.map((item) => ({
          id: item.id,
          partStkNo: item.partStkNo,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice.toString(),
          lineTotal: item.lineTotal.toString()
        })),
        total: cartTotal.toString()
      }}
      onAddToCart={addToCart}
      onUpdateCartItem={updateCartItem}
    />
  );
}

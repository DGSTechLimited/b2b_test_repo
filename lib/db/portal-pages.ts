import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { clearCartIfExpired } from "@/lib/cart-expiry";

const tierFieldMap = {
  A: "bandA",
  B: "bandB",
  C: "bandC",
  D: "bandD",
  E: "bandE",
  F: "bandF"
} as const;

type DealerTiers = {
  genuineTier: "A" | "B" | "C" | "D" | "E" | "F";
  aftermarketTier: "A" | "B" | "C" | "D" | "E" | "F";
  brandedTier: "A" | "B" | "C" | "D" | "E" | "F";
};

export async function getCartPageData(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const expired = await clearCartIfExpired(cart);
  const items = expired ? [] : cart?.items ?? [];
  const total = items
    .reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0))
    .toString();

  return {
    items: items.map((item) => ({
      id: item.id,
      partStkNo: item.partStkNo,
      description: item.description,
      qty: item.qty,
      lineTotal: item.lineTotal.toString()
    })),
    total
  };
}

export async function getCheckoutPageData(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true }
  });

  const expired = await clearCartIfExpired(cart);
  const items = expired ? [] : cart?.items ?? [];
  const total = items
    .reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0))
    .toString();

  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId }
  });

  return {
    items: items.map((item) => ({
      id: item.id,
      partStkNo: item.partStkNo,
      qty: item.qty,
      lineTotal: item.lineTotal.toString()
    })),
    total,
    defaultShippingMethod: dealerProfile?.dispatchMethodDefault ?? "",
    isEmpty: items.length === 0
  };
}

export async function getPartsPageData(params: {
  userId: string;
  searchParams: Record<string, string | string[] | undefined>;
  enableSearchFilters: boolean;
  enablePricingFilters: boolean;
}) {
  const { userId, searchParams, enableSearchFilters, enablePricingFilters } = params;
  const dealerProfile = await prisma.dealerProfile.findUnique({ where: { userId } });

  if (!dealerProfile) {
    throw new Error("Dealer profile missing.");
  }

  const q = (searchParams.q as string) || "";
  const manufacturer = enableSearchFilters ? (searchParams.manufacturer as string) || "" : "";
  const supplier = enableSearchFilters ? (searchParams.supplier as string) || "" : "";
  const brand = enableSearchFilters ? (searchParams.brand as string) || "" : "";
  const oem = enableSearchFilters ? (searchParams.oem as string) || "" : "";
  const partType = (searchParams.partType as string) || "";
  const rawPriceMin = enablePricingFilters && searchParams.priceMin
    ? Number(searchParams.priceMin)
    : null;
  const rawPriceMax = enablePricingFilters && searchParams.priceMax
    ? Number(searchParams.priceMax)
    : null;
  const priceMin = rawPriceMin !== null && !Number.isNaN(rawPriceMin) ? rawPriceMin : null;
  const priceMax = rawPriceMax !== null && !Number.isNaN(rawPriceMax) ? rawPriceMax : null;

  const tiers: DealerTiers = {
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
  const cartTotal = cartItems
    .reduce((sum, item) => sum.add(item.lineTotal), new Prisma.Decimal(0))
    .toString();

  return {
    dealerTiers: tiers,
    parts: parts.map((part) => ({
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
    })),
    filters: {
      q,
      manufacturer,
      supplier,
      brand,
      oem,
      partType,
      priceMin,
      priceMax
    },
    initialCart: {
      items: cartItems.map((item) => ({
        id: item.id,
        partStkNo: item.partStkNo,
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString()
      })),
      total: cartTotal
    }
  };
}

import type { CatalogPart, PartType, PricingTier } from "@/lib/db/types";

type DealerTierSet = {
  genuineTier: PricingTier;
  aftermarketTier: PricingTier;
  brandedTier: PricingTier;
};

export function getTierPrice(part: CatalogPart, tier: PricingTier) {
  switch (tier) {
    case "A":
      return part.bandA;
    case "B":
      return part.bandB;
    case "C":
      return part.bandC;
    case "D":
      return part.bandD;
    case "E":
      return part.bandE;
    case "F":
      return part.bandF;
    default:
      return part.bandA;
  }
}

export function resolveTierForCategory(tiers: DealerTierSet, partType: PartType) {
  switch (partType) {
    case "GENUINE":
      return tiers.genuineTier;
    case "AFTERMARKET":
      return tiers.aftermarketTier;
    case "BRANDED":
      return tiers.brandedTier;
    default:
      return tiers.aftermarketTier;
  }
}

export function resolveUnitPrice(part: CatalogPart, tiers: DealerTierSet) {
  const tier = resolveTierForCategory(tiers, part.partType);
  const tierPrice = getTierPrice(part, tier);
  const unitPrice = tierPrice.lessThan(part.minimumPrice) ? part.minimumPrice : tierPrice;
  return { tier, unitPrice };
}

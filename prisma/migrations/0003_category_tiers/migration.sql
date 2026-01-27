-- Category-based pricing tiers
CREATE TYPE "PricingTier" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');

ALTER TYPE "PartType" ADD VALUE IF NOT EXISTS 'BRANDED';

ALTER TABLE "DealerProfile"
  ADD COLUMN "genuine_tier" "PricingTier",
  ADD COLUMN "aftermarket_tier" "PricingTier",
  ADD COLUMN "branded_tier" "PricingTier";

UPDATE "DealerProfile"
SET
  "genuine_tier" = (CASE "band"
    WHEN 'BAND_1' THEN 'A'
    WHEN 'BAND_2' THEN 'B'
    WHEN 'BAND_3' THEN 'C'
    WHEN 'BAND_4' THEN 'D'
    ELSE 'A'
  END)::"PricingTier",
  "aftermarket_tier" = (CASE "band"
    WHEN 'BAND_1' THEN 'A'
    WHEN 'BAND_2' THEN 'B'
    WHEN 'BAND_3' THEN 'C'
    WHEN 'BAND_4' THEN 'D'
    ELSE 'A'
  END)::"PricingTier",
  "branded_tier" = (CASE "band"
    WHEN 'BAND_1' THEN 'A'
    WHEN 'BAND_2' THEN 'B'
    WHEN 'BAND_3' THEN 'C'
    WHEN 'BAND_4' THEN 'D'
    ELSE 'A'
  END)::"PricingTier";

ALTER TABLE "DealerProfile"
  ALTER COLUMN "genuine_tier" SET NOT NULL,
  ALTER COLUMN "aftermarket_tier" SET NOT NULL,
  ALTER COLUMN "branded_tier" SET NOT NULL;

ALTER TABLE "DealerProfile" DROP COLUMN "band";
DROP TYPE "DealerBand";

ALTER TABLE "StagingPart"
  ADD COLUMN "bandA" TEXT,
  ADD COLUMN "bandB" TEXT,
  ADD COLUMN "bandC" TEXT,
  ADD COLUMN "bandD" TEXT,
  ADD COLUMN "bandE" TEXT,
  ADD COLUMN "bandF" TEXT;

UPDATE "StagingPart"
SET
  "bandA" = "band1",
  "bandB" = "band2",
  "bandC" = "band3",
  "bandD" = "band4",
  "bandE" = "band4",
  "bandF" = "band4";

ALTER TABLE "StagingPart"
  DROP COLUMN "band1",
  DROP COLUMN "band2",
  DROP COLUMN "band3",
  DROP COLUMN "band4";

ALTER TABLE "CatalogPart"
  ADD COLUMN "bandA" DECIMAL(12,2),
  ADD COLUMN "bandB" DECIMAL(12,2),
  ADD COLUMN "bandC" DECIMAL(12,2),
  ADD COLUMN "bandD" DECIMAL(12,2),
  ADD COLUMN "bandE" DECIMAL(12,2),
  ADD COLUMN "bandF" DECIMAL(12,2);

UPDATE "CatalogPart"
SET
  "bandA" = "band1",
  "bandB" = "band2",
  "bandC" = "band3",
  "bandD" = "band4",
  "bandE" = "band4",
  "bandF" = "band4";

ALTER TABLE "CatalogPart"
  ALTER COLUMN "bandA" SET NOT NULL,
  ALTER COLUMN "bandB" SET NOT NULL,
  ALTER COLUMN "bandC" SET NOT NULL,
  ALTER COLUMN "bandD" SET NOT NULL,
  ALTER COLUMN "bandE" SET NOT NULL,
  ALTER COLUMN "bandF" SET NOT NULL;

ALTER TABLE "CatalogPart"
  DROP COLUMN "band1",
  DROP COLUMN "band2",
  DROP COLUMN "band3",
  DROP COLUMN "band4";

ALTER TABLE "OrderItem"
  ADD COLUMN "priceTier" "PricingTier" NOT NULL DEFAULT 'A',
  ADD COLUMN "priceCategory" "PartType" NOT NULL DEFAULT 'AFTERMARKET';

UPDATE "OrderItem"
SET "priceCategory" = "CatalogPart"."partType"
FROM "CatalogPart"
WHERE "OrderItem"."partId" = "CatalogPart"."id";

ALTER TABLE "OrderItem" ALTER COLUMN "priceTier" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "priceCategory" DROP DEFAULT;

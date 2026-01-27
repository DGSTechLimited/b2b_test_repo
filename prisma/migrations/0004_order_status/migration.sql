-- Order status upload unification

CREATE TYPE "OrderLineStatusState" AS ENUM (
  'OPEN',
  'PARTIALLY_FULFILLED',
  'BACKORDERED',
  'FULFILLED',
  'CANCELLED'
);

CREATE TYPE "UploadType_new" AS ENUM (
  'PARTS_AFTERMARKET',
  'PARTS_GENUINE',
  'SUPERSESSION',
  'ORDER_STATUS'
);

ALTER TABLE "UploadBatch"
  ALTER COLUMN "type" TYPE "UploadType_new"
  USING (
    CASE
      WHEN "type" IN ('BACKORDERS', 'FULFILLMENT_STATUS') THEN 'ORDER_STATUS'
      ELSE "type"::text
    END::"UploadType_new"
  );

DROP TYPE "UploadType";
ALTER TYPE "UploadType_new" RENAME TO "UploadType";

DROP TABLE IF EXISTS "Backorder";
DROP TABLE IF EXISTS "StagingBackorder";
DROP TABLE IF EXISTS "StagingFulfillment";

CREATE TABLE "StagingOrderStatus" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "orderNumber" TEXT,
  "accountNo" TEXT,
  "partNumber" TEXT,
  "orderedQty" TEXT,
  "fulfilledQty" TEXT,
  "backorderedQty" TEXT,
  "status" TEXT,
  "statusDate" TEXT,
  "notes" TEXT,
  "raw" JSONB NOT NULL,
  CONSTRAINT "StagingOrderStatus_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OrderLineStatus" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL,
  "accountNo" TEXT NOT NULL,
  "partNumber" TEXT NOT NULL,
  "orderedQty" INTEGER NOT NULL,
  "fulfilledQty" INTEGER,
  "backorderedQty" INTEGER,
  "status" "OrderLineStatusState" NOT NULL,
  "statusDate" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "sourceBatchId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderLineStatus_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderLineStatus_sourceBatchId_fkey" FOREIGN KEY ("sourceBatchId") REFERENCES "UploadBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OrderLineStatus_orderId_partNumber_key" ON "OrderLineStatus"("orderId", "partNumber");
CREATE INDEX "OrderLineStatus_accountNo_idx" ON "OrderLineStatus"("accountNo");
CREATE INDEX "OrderLineStatus_status_idx" ON "OrderLineStatus"("status");
CREATE INDEX "StagingOrderStatus_batchId_idx" ON "StagingOrderStatus"("batchId");

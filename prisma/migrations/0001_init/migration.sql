-- Initial schema for dealer portal
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'DEALER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "DealerBand" AS ENUM ('BAND_1', 'BAND_2', 'BAND_3', 'BAND_4');
CREATE TYPE "PartType" AS ENUM ('AFTERMARKET', 'GENUINE');
CREATE TYPE "UploadType" AS ENUM ('PARTS_AFTERMARKET', 'PARTS_GENUINE', 'BACKORDERS', 'SUPERSESSION', 'FULFILLMENT_STATUS');
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'APPLIED', 'REJECTED');
CREATE TYPE "OrderStatus" AS ENUM ('SUSPENDED', 'ON_HOLD', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'BACKORDERED', 'CANCELLED');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "DealerProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "accountNo" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "band" "DealerBand" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DealerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UploadBatch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "UploadType" NOT NULL,
  "filename" TEXT NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
  "errorCsvPath" TEXT,
  "uploadedById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "StagingPart" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "partType" "PartType" NOT NULL,
  "manufacturer" TEXT,
  "stkNo" TEXT,
  "landRoverNo" TEXT,
  "jaguarNo" TEXT,
  "supplier" TEXT,
  "brand" TEXT,
  "oem" TEXT,
  "description" TEXT,
  "freeStock" TEXT,
  "tradePrice" TEXT,
  "band1" TEXT,
  "band2" TEXT,
  "band3" TEXT,
  "band4" TEXT,
  "minimumPrice" TEXT,
  "tariffCode" TEXT,
  "countryOfOrigin" TEXT,
  "barcode" TEXT,
  "raw" JSONB NOT NULL,
  CONSTRAINT "StagingPart_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CatalogPart" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "stkNo" TEXT NOT NULL UNIQUE,
  "manufacturer" TEXT NOT NULL,
  "landRoverNo" TEXT,
  "jaguarNo" TEXT,
  "supplier" TEXT,
  "brand" TEXT,
  "oem" TEXT,
  "description" TEXT,
  "freeStock" INTEGER NOT NULL,
  "tradePrice" DECIMAL(12,2) NOT NULL,
  "band1" DECIMAL(12,2) NOT NULL,
  "band2" DECIMAL(12,2) NOT NULL,
  "band3" DECIMAL(12,2) NOT NULL,
  "band4" DECIMAL(12,2) NOT NULL,
  "minimumPrice" DECIMAL(12,2) NOT NULL,
  "tariffCode" TEXT,
  "countryOfOrigin" TEXT,
  "barcode" TEXT,
  "imageUrl" TEXT,
  "partType" "PartType" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Supersession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "oldPartNo" TEXT NOT NULL UNIQUE,
  "newPartNo" TEXT NOT NULL,
  "reason" TEXT,
  "effectiveDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "StagingSupersession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "oldPartNo" TEXT,
  "newPartNo" TEXT,
  "reason" TEXT,
  "effectiveDate" TEXT,
  "raw" JSONB NOT NULL,
  CONSTRAINT "StagingSupersession_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "StagingBackorder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "accountNo" TEXT,
  "customerName" TEXT,
  "yourOrderNo" TEXT,
  "ourNo" TEXT,
  "itm" TEXT,
  "part" TEXT,
  "description" TEXT,
  "qOrd" TEXT,
  "qO" TEXT,
  "inWh" TEXT,
  "currency" TEXT,
  "unitPrice" TEXT,
  "lineValue" TEXT,
  "raw" JSONB NOT NULL,
  CONSTRAINT "StagingBackorder_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Backorder" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID,
  "accountNo" TEXT NOT NULL,
  "customerName" TEXT,
  "yourOrderNo" TEXT,
  "ourNo" TEXT,
  "itm" TEXT,
  "part" TEXT,
  "description" TEXT,
  "qOrd" INTEGER,
  "qO" INTEGER,
  "inWh" INTEGER,
  "currency" TEXT,
  "unitPrice" DECIMAL(12,2),
  "lineValue" DECIMAL(12,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dealerProfileId" UUID,
  CONSTRAINT "Backorder_dealerProfileId_fkey" FOREIGN KEY ("dealerProfileId") REFERENCES "DealerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "StagingFulfillment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" UUID NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "yourOrderNo" TEXT,
  "itm" TEXT,
  "part" TEXT,
  "status" TEXT,
  "shippedQty" TEXT,
  "backorderedQty" TEXT,
  "trackingNo" TEXT,
  "etaDate" TEXT,
  "updatedAtRaw" TEXT,
  "raw" JSONB NOT NULL,
  CONSTRAINT "StagingFulfillment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "UploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Cart" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CartItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cartId" UUID NOT NULL,
  "partId" UUID,
  "partStkNo" TEXT NOT NULL,
  "description" TEXT,
  "qty" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "CatalogPart"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Order" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL,
  "dealerAccountNo" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" UUID NOT NULL,
  "partId" UUID,
  "partStkNo" TEXT NOT NULL,
  "description" TEXT,
  "qty" INTEGER NOT NULL,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "lineTotal" DECIMAL(12,2) NOT NULL,
  "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
  "shippedQty" INTEGER,
  "backorderedQty" INTEGER,
  "trackingNo" TEXT,
  "etaDate" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_partId_fkey" FOREIGN KEY ("partId") REFERENCES "CatalogPart"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID,
  "action" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CatalogPart_stkNo_idx" ON "CatalogPart"("stkNo");
CREATE INDEX "CatalogPart_manufacturer_idx" ON "CatalogPart"("manufacturer");
CREATE INDEX "CatalogPart_supplier_idx" ON "CatalogPart"("supplier");
CREATE INDEX "CatalogPart_brand_idx" ON "CatalogPart"("brand");
CREATE INDEX "CatalogPart_oem_idx" ON "CatalogPart"("oem");
CREATE INDEX "CatalogPart_landRoverNo_idx" ON "CatalogPart"("landRoverNo");
CREATE INDEX "CatalogPart_jaguarNo_idx" ON "CatalogPart"("jaguarNo");
CREATE INDEX "CatalogPart_description_idx" ON "CatalogPart"("description");
CREATE INDEX "CatalogPart_barcode_idx" ON "CatalogPart"("barcode");
CREATE INDEX "StagingPart_batchId_idx" ON "StagingPart"("batchId");
CREATE INDEX "StagingPart_stkNo_idx" ON "StagingPart"("stkNo");
CREATE INDEX "StagingSupersession_batchId_idx" ON "StagingSupersession"("batchId");
CREATE INDEX "StagingBackorder_batchId_idx" ON "StagingBackorder"("batchId");
CREATE INDEX "StagingFulfillment_batchId_idx" ON "StagingFulfillment"("batchId");
CREATE INDEX "Backorder_accountNo_idx" ON "Backorder"("accountNo");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

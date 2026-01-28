"use server";

import { OrderLineStatusState, Prisma, UploadType } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import * as XLSX from "xlsx";
import { parseCsv } from "@/lib/csv/parse";
import { buildErrorCsv, validateHeaders } from "@/lib/csv/validation";
import {
  ORDER_STATUS_HEADERS,
  PARTS_AFTERMARKET_HEADERS,
  PARTS_GENUINE_HEADERS,
  SUPERSESSION_HEADERS
} from "@/lib/csv/headers";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";
import { detectSupersessionCycles } from "@/lib/supersession";

const uploadDir = path.join(process.cwd(), "uploads");

async function ensureUploadDir() {
  await fs.mkdir(uploadDir, { recursive: true });
}

async function writeErrorCsv(batchId: string, csv: string) {
  await ensureUploadDir();
  const filePath = path.join(uploadDir, `${batchId}-errors.csv`);
  await fs.writeFile(filePath, csv, "utf8");
  return filePath;
}

function cleanNumber(value: string) {
  return value.replace(/,/g, "").trim();
}

function parseInteger(value: string, field: string, errors: string[]) {
  const cleaned = cleanNumber(value);
  if (!cleaned) {
    errors.push(`${field} is required.`);
    return null;
  }
  const parsed = Number.parseInt(cleaned, 10);
  if (Number.isNaN(parsed)) {
    errors.push(`${field} must be an integer.`);
    return null;
  }
  return parsed;
}

function parseDecimal(value: string, field: string, errors: string[]) {
  const cleaned = cleanNumber(value);
  if (!cleaned) {
    errors.push(`${field} is required.`);
    return null;
  }
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) {
    errors.push(`${field} must be a number.`);
    return null;
  }
  return new Prisma.Decimal(parsed);
}

function optionalDecimal(value: string) {
  const cleaned = cleanNumber(value);
  if (!cleaned) {
    return null;
  }
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Prisma.Decimal(parsed);
}

function optionalInteger(value: string) {
  const cleaned = cleanNumber(value);
  if (!cleaned) {
    return null;
  }
  const parsed = Number.parseInt(cleaned, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

const partsWorkbookHeaders = [
  "Product Code",
  "Full Description",
  "Free Stock",
  "Net 1",
  "Net 2",
  "Net 3",
  "Net 4",
  "Net 5",
  "Net 6",
  "Net 7",
  "Discount code"
];

const discountCodeToCategory = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "gn") return "GENUINE";
  if (normalized === "es") return "AFTERMARKET";
  if (normalized === "br") return "BRANDED";
  return null;
};

const isXlsxFile = (name: string) => name.toLowerCase().endsWith(".xlsx");

async function createBatch(type: UploadType, filename: string, userId: string) {
  // LLID: L-ADMIN-001-create-upload-batch
  return prisma.uploadBatch.create({
    data: {
      type,
      filename,
      uploadedById: userId
    }
  });
}

export type DealerFormState = {
  ok: boolean;
  error?: string;
};

export async function createDealer(
  _prevState: DealerFormState,
  formData: FormData
): Promise<DealerFormState> {
  const session = await requireRole("ADMIN");
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    accountNo: z.string().min(2),
    name: z.string().min(2),
    genuineTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    aftermarketTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    brandedTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    dispatchMethodDefault: z.string().optional()
  });

  const result = schema.safeParse({
    email: String(formData.get("email") || "").toLowerCase().trim(),
    password: String(formData.get("password") || ""),
    accountNo: String(formData.get("accountNo") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    genuineTier: String(formData.get("genuineTier") || ""),
    aftermarketTier: String(formData.get("aftermarketTier") || ""),
    brandedTier: String(formData.get("brandedTier") || ""),
    status: String(formData.get("status") || "").toUpperCase() || undefined,
    dispatchMethodDefault: String(formData.get("dispatchMethodDefault") || "").trim() || undefined
  });

  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? "Invalid form data."
    };
  }

  const data = result.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { ok: false, error: "User already exists." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  // LLID: L-ADMIN-002-create-dealer-user
  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "DEALER",
      status: "ACTIVE",
      name: data.name,
      createdByUserId: (session.user as any).id,
      mustChangePassword: true,
      dealerProfile: {
        create: {
          accountNo: data.accountNo,
          dealerName: data.name,
          genuineTier: data.genuineTier,
          aftermarketTier: data.aftermarketTier,
          brandedTier: data.brandedTier,
          status: data.status ?? "ACTIVE",
          dispatchMethodDefault: data.dispatchMethodDefault ?? null
        }
      }
    }
  });

  // LLID: L-ADMIN-003-audit-dealer-create
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "dealer.create",
      metadata: { email: data.email }
    }
  });

  return { ok: true };
}

export async function uploadParts(
  formData: FormData,
  uploadType: UploadType,
  allowedCategories: Array<"AFTERMARKET" | "GENUINE" | "BRANDED">
) {
  const session = await requireRole("ADMIN");
  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("CSV file is required.");
  }

  const isXlsx = isXlsxFile(file.name);
  type PartsInputRow = Record<string, string> & { rawRow?: Record<string, string> };
  let headers: string[] = [];
  let rows: PartsInputRow[] = [];

  if (isXlsx) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, {
      defval: "",
      raw: false
    });
    if (rawRows.length === 0) {
      throw new Error("XLSX contains no rows.");
    }
    headers = Object.keys(rawRows[0] ?? {});
    const missingHeaders = partsWorkbookHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`XLSX is missing required columns: ${missingHeaders.join(", ")}`);
    }
    rows = rawRows.map((row) => ({
      Manufacturer: String(row["Manufacturer"] ?? "DGS"),
      StkNo: String(row["Product Code"] ?? ""),
      Category: String(row["Discount code"] ?? ""),
      Description: String(row["Full Description"] ?? ""),
      "Free Stock": String(row["Free Stock"] ?? ""),
      "Trade Price": String(row["Net 1"] ?? ""),
      "Band A": String(row["Net 1"] ?? ""),
      "Band B": String(row["Net 2"] ?? ""),
      "Band C": String(row["Net 3"] ?? ""),
      "Band D": String(row["Net 4"] ?? ""),
      "Band E": String(row["Net 5"] ?? ""),
      "Band F": String(row["Net 6"] ?? ""),
      "Minimum Price": String(row["Net 7"] ?? ""),
      rawRow: row
    }));
  } else {
    const text = await file.text();
    const parsed = parseCsv(text);
    headers = parsed.headers;
    rows = parsed.rows as PartsInputRow[];
    if (rows.length === 0) {
      throw new Error("CSV contains no rows.");
    }

    const expectedHeaders =
      uploadType === "PARTS_AFTERMARKET" ? PARTS_AFTERMARKET_HEADERS : PARTS_GENUINE_HEADERS;
    const headerCheck = validateHeaders(headers, expectedHeaders);
    if (!headerCheck.ok) {
      throw new Error(headerCheck.message);
    }
  }

  const batch = await createBatch(uploadType, file.name, (session.user as any).id);

  const stagingRows = rows.map((row, index) => {
    const rawCategory = String(row["Category"] ?? "").trim();
    const normalizedCategory = isXlsx
      ? discountCodeToCategory(rawCategory) ?? allowedCategories[0]
      : rawCategory.toUpperCase() === "AFTERMARKET" ||
          rawCategory.toUpperCase() === "GENUINE" ||
          rawCategory.toUpperCase() === "BRANDED"
        ? rawCategory.toUpperCase()
        : allowedCategories[0];
    return {
    batchId: batch.id,
    rowNumber: index + 1,
    partType: normalizedCategory,
    manufacturer: row["Manufacturer"],
    stkNo: row["StkNo"],
    landRoverNo: row["LandRover No"],
    jaguarNo: row["Jaguar No"],
    supplier: row["Supplier"],
    brand: row["Brand"],
    oem: row["OEM"],
    description: row["Description"],
    freeStock: row["Free Stock"],
    tradePrice: row["Trade Price"],
    bandA: row["Band A"],
    bandB: row["Band B"],
    bandC: row["Band C"],
    bandD: row["Band D"],
    bandE: row["Band E"],
    bandF: row["Band F"],
    minimumPrice: row["Minimum Price"],
    tariffCode: row["TARIFFCODE"],
    countryOfOrigin: row["Country of Orgin"],
    barcode: row["Barcode"],
    raw: row.rawRow ?? row
    };
  });

  // LLID: L-ADMIN-004-stage-parts-rows
  await prisma.stagingPart.createMany({ data: stagingRows });

  const errors: Record<string, string>[] = [];
  const validRows: {
    rowNumber: number;
    stkNo: string;
    createData: Prisma.CatalogPartUncheckedCreateInput;
    updateData: Prisma.CatalogPartUncheckedUpdateInput;
  }[] = [];

  const allowedCategorySet = new Set(allowedCategories);

  const validCategories = new Set(["AFTERMARKET", "GENUINE", "BRANDED"]);
  const skipDisallowedCategories = isXlsx;

  stagingRows.forEach((row) => {
    const rowErrors: string[] = [];
    const rawCategory = String(
      (row.raw as Record<string, string>)?.Category ??
        (row.raw as Record<string, string>)?.["Discount code"] ??
        ""
    ).trim();
    const category = isXlsx
      ? discountCodeToCategory(rawCategory) ?? ""
      : rawCategory.toUpperCase();
    if (!row.manufacturer?.trim()) {
      rowErrors.push("Manufacturer is required.");
    }
    if (!row.stkNo?.trim()) {
      rowErrors.push("StkNo is required.");
    }
    if (!row.description?.trim()) {
      rowErrors.push("Description is required.");
    }
    if (!category) {
      rowErrors.push("Category is required.");
    } else if (!validCategories.has(category)) {
      rowErrors.push(`Category ${rawCategory} is invalid.`);
    } else if (!allowedCategorySet.has(category as "AFTERMARKET" | "GENUINE" | "BRANDED")) {
      if (skipDisallowedCategories) {
        return;
      }
      rowErrors.push(`Category ${category} is not allowed for this upload.`);
    }

    const freeStock = parseInteger(row.freeStock || "", "Free Stock", rowErrors);
    const tradePrice = parseDecimal(row.tradePrice || "", "Trade Price", rowErrors);
    const bandA = parseDecimal(row.bandA || "", "Band A", rowErrors);
    const bandB = parseDecimal(row.bandB || "", "Band B", rowErrors);
    const bandC = parseDecimal(row.bandC || "", "Band C", rowErrors);
    const bandD = parseDecimal(row.bandD || "", "Band D", rowErrors);
    const bandE = parseDecimal(row.bandE || "", "Band E", rowErrors);
    const bandF = parseDecimal(row.bandF || "", "Band F", rowErrors);
    const minimumPrice = parseDecimal(row.minimumPrice || "", "Minimum Price", rowErrors);

    if (rowErrors.length > 0) {
      errors.push({ ...row.raw, error_reason: rowErrors.join(" ") });
      return;
    }

    const trimmedCategory = category as "AFTERMARKET" | "GENUINE" | "BRANDED";
    const baseData = {
      stkNo: row.stkNo!.trim(),
      manufacturer: row.manufacturer!.trim(),
      landRoverNo: row.landRoverNo?.trim() || null,
      jaguarNo: row.jaguarNo?.trim() || null,
      supplier: row.supplier?.trim() || null,
      brand: row.brand?.trim() || null,
      oem: row.oem?.trim() || null,
      description: row.description?.trim() || null,
      freeStock: freeStock!,
      tradePrice: tradePrice!,
      bandA: bandA!,
      bandB: bandB!,
      bandC: bandC!,
      bandD: bandD!,
      bandE: bandE!,
      bandF: bandF!,
      minimumPrice: minimumPrice!,
      tariffCode: row.tariffCode?.trim() || null,
      countryOfOrigin: row.countryOfOrigin?.trim() || null,
      barcode: row.barcode?.trim() || null,
      partType: trimmedCategory,
      isActive: true,
      lastSeenAt: new Date()
    };

    validRows.push({
      rowNumber: row.rowNumber,
      stkNo: row.stkNo!.trim(),
      createData: { ...baseData, imageUrl: null },
      updateData: baseData
    });
  });

  if (errors.length > 0) {
    const errorHeaders = isXlsx ? partsWorkbookHeaders : headers;
    const errorCsv = buildErrorCsv(errorHeaders, errors, "error_reason");
    const errorPath = await writeErrorCsv(batch.id, errorCsv);
    // LLID: L-ADMIN-005-reject-parts-batch
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: { status: "REJECTED", errorCsvPath: errorPath }
    });
    return { ok: false, batchId: batch.id };
  }

  if (validRows.length === 0) {
    // LLID: L-ADMIN-006-reject-parts-batch-empty
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: { status: "REJECTED" }
    });
    throw new Error("No valid rows matched the selected category.");
  }

  const latestByStk = new Map<string, typeof validRows[number]>();
  validRows.forEach((row) => {
    latestByStk.set(row.stkNo, row);
  });

  const rowsToApply = Array.from(latestByStk.values());
  const chunks: typeof rowsToApply[] = [];
  for (let i = 0; i < rowsToApply.length; i += 200) {
    chunks.push(rowsToApply.slice(i, i + 200));
  }

  for (const chunk of chunks) {
    // LLID: L-ADMIN-007-upsert-catalog-parts
    await prisma.$transaction(
      chunk.map((row) => {
        // LLID: L-ADMIN-007-upsert-catalog-part
        return prisma.catalogPart.upsert({
          where: { stkNo: row.stkNo },
          update: row.updateData,
          create: row.createData
        });
      })
    );
  }

  const uploadedStkNos = rowsToApply.map((row) => row.stkNo);
  const deactivateCandidates = await prisma.catalogPart.findMany({
    where: {
      stkNo: { notIn: uploadedStkNos },
      orderItems: { none: {} },
      partType: { in: Array.from(allowedCategorySet) }
    },
    select: { id: true }
  });

  if (deactivateCandidates.length > 0) {
    // LLID: L-ADMIN-008-deactivate-missing-parts
    await prisma.catalogPart.updateMany({
      where: { id: { in: deactivateCandidates.map((part) => part.id) } },
      data: { isActive: false }
    });
  }

  // LLID: L-ADMIN-009-apply-parts-batch
  await prisma.uploadBatch.update({
    where: { id: batch.id },
    data: { status: "APPLIED" }
  });

  // LLID: L-ADMIN-010-audit-parts-upload
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "upload.parts",
      metadata: { batchId: batch.id, uploadType, categories: allowedCategories }
    }
  });

  return { ok: true, batchId: batch.id };
}

export async function uploadPartsAftermarket(formData: FormData) {
  return uploadParts(formData, "PARTS_AFTERMARKET", ["AFTERMARKET"]);
}

export async function uploadPartsGenuine(formData: FormData) {
  return uploadParts(formData, "PARTS_GENUINE", ["GENUINE", "BRANDED"]);
}

export async function uploadOrderStatus(formData: FormData) {
  const session = await requireRole("ADMIN");
  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  if (rows.length === 0) {
    throw new Error("CSV contains no rows.");
  }

  const headerCheck = validateHeaders(headers, ORDER_STATUS_HEADERS);
  if (!headerCheck.ok) {
    throw new Error(headerCheck.message);
  }

  const batch = await createBatch("ORDER_STATUS", file.name, (session.user as any).id);
  const stagingRows = rows.map((row, index) => ({
    batchId: batch.id,
    rowNumber: index + 1,
    orderNumber: row["Order Number"],
    accountNo: row["Account Number"],
    partNumber: row["Part Number"],
    orderedQty: row["Ordered Quantity"],
    fulfilledQty: row["Fulfilled Quantity"],
    backorderedQty: row["Backordered Quantity"],
    status: row["Status"],
    statusDate: row["Status Date"],
    notes: row["Notes"],
    raw: row
  }));

  // LLID: L-ADMIN-011-stage-order-status
  await prisma.stagingOrderStatus.createMany({ data: stagingRows });

  const errors: Record<string, string>[] = [];
  const validRows: {
    orderId: string;
    accountNo: string;
    partNumber: string;
    orderedQty: number;
    fulfilledQty: number | null;
    backorderedQty: number | null;
    status: OrderLineStatusState;
    statusDate: Date;
    notes: string | null;
  }[] = [];

  const orderNumbers = Array.from(
    new Set(
      stagingRows
        .map((row) => row.orderNumber?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const orders = await prisma.order.findMany({
    where: { orderNumber: { in: orderNumbers } },
    include: { items: true }
  });

  const orderMap = new Map(
    orders.map((order) => [
      order.orderNumber,
      {
        id: order.id,
        accountNo: order.dealerAccountNo,
        items: new Set(order.items.map((item) => item.partStkNo))
      }
    ])
  );

  const allowedStatuses = new Set([
    "OPEN",
    "PARTIALLY_FULFILLED",
    "BACKORDERED",
    "FULFILLED",
    "CANCELLED"
  ]);

  stagingRows.forEach((row) => {
    const rowErrors: string[] = [];
    const orderNumber = row.orderNumber?.trim();
    const accountNo = row.accountNo?.trim();
    const partNumber = row.partNumber?.trim();
    const statusRaw = row.status?.trim();

    if (!orderNumber) {
      rowErrors.push("Order Number is required.");
    }
    if (!accountNo) {
      rowErrors.push("Account Number is required.");
    }
    if (!partNumber) {
      rowErrors.push("Part Number is required.");
    }

    const orderedQty = parseInteger(row.orderedQty ?? "", "Ordered Quantity", rowErrors);
    const fulfilledQty = row.fulfilledQty ? optionalInteger(row.fulfilledQty) : null;
    const backorderedQty = row.backorderedQty ? optionalInteger(row.backorderedQty) : null;

    if (row.fulfilledQty && fulfilledQty === null) {
      rowErrors.push("Fulfilled Quantity must be numeric.");
    }
    if (row.backorderedQty && backorderedQty === null) {
      rowErrors.push("Backordered Quantity must be numeric.");
    }

    if (!statusRaw) {
      rowErrors.push("Status is required.");
    }

    const status = statusRaw ? statusRaw.toUpperCase() : "";
    if (statusRaw && !allowedStatuses.has(status)) {
      rowErrors.push("Status is invalid.");
    }

    const statusDate = row.statusDate ? new Date(row.statusDate) : null;
    if (!statusDate || Number.isNaN(statusDate.getTime())) {
      rowErrors.push("Status Date is invalid.");
    }

    const order = orderNumber ? orderMap.get(orderNumber) : null;
    if (orderNumber && !order) {
      rowErrors.push(`Order ${orderNumber} not found.`);
    }

    if (order && accountNo && order.accountNo !== accountNo) {
      rowErrors.push(`Account Number ${accountNo} does not match order.`);
    }

    if (order && partNumber && !order.items.has(partNumber)) {
      rowErrors.push(`Part ${partNumber} not found on order.`);
    }

    if (rowErrors.length > 0) {
      errors.push({ ...row.raw, error_reason: rowErrors.join(" ") });
      return;
    }

    validRows.push({
      orderId: order!.id,
      accountNo: accountNo!,
      partNumber: partNumber!,
      orderedQty: orderedQty!,
      fulfilledQty,
      backorderedQty,
      status: status as OrderLineStatusState,
      statusDate: statusDate!,
      notes: row.notes?.trim() || null
    });
  });

  if (errors.length > 0) {
    const errorCsv = buildErrorCsv(headers, errors, "error_reason");
    const errorPath = await writeErrorCsv(batch.id, errorCsv);
    // LLID: L-ADMIN-012-reject-order-status-batch
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: { status: "REJECTED", errorCsvPath: errorPath }
    });
    return { ok: false, batchId: batch.id };
  }

  const uniqueOrderIds = Array.from(new Set(validRows.map((row) => row.orderId)));
  const uniqueParts = Array.from(new Set(validRows.map((row) => row.partNumber)));

  const existing = await prisma.orderLineStatus.findMany({
    where: {
      orderId: { in: uniqueOrderIds },
      partNumber: { in: uniqueParts }
    }
  });

  const existingMap = new Map(
    existing.map((row) => [`${row.orderId}::${row.partNumber}`, row])
  );

  const updates = validRows.filter((row) => {
    const key = `${row.orderId}::${row.partNumber}`;
    const current = existingMap.get(key);
    if (!current) {
      return true;
    }
    return row.statusDate > current.statusDate;
  });

  // LLID: L-ADMIN-013-upsert-order-line-status
  await prisma.$transaction(
    updates.map((row) => {
      // LLID: L-ADMIN-013-upsert-order-line-status
      return prisma.orderLineStatus.upsert({
        where: { orderId_partNumber: { orderId: row.orderId, partNumber: row.partNumber } },
        update: {
          accountNo: row.accountNo,
          orderedQty: row.orderedQty,
          fulfilledQty: row.fulfilledQty,
          backorderedQty: row.backorderedQty,
          status: row.status,
          statusDate: row.statusDate,
          notes: row.notes,
          sourceBatchId: batch.id
        },
        create: {
          orderId: row.orderId,
          accountNo: row.accountNo,
          partNumber: row.partNumber,
          orderedQty: row.orderedQty,
          fulfilledQty: row.fulfilledQty,
          backorderedQty: row.backorderedQty,
          status: row.status,
          statusDate: row.statusDate,
          notes: row.notes,
          sourceBatchId: batch.id
        }
      });
    })
  );

  // LLID: L-ADMIN-014-apply-order-status-batch
  await prisma.uploadBatch.update({
    where: { id: batch.id },
    data: { status: "APPLIED" }
  });

  // LLID: L-ADMIN-015-audit-order-status-upload
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "upload.order_status",
      metadata: { batchId: batch.id }
    }
  });

  return { ok: true, batchId: batch.id };
}

export async function uploadSupersession(formData: FormData) {
  const session = await requireRole("ADMIN");
  const file = formData.get("file") as File | null;
  if (!file) {
    throw new Error("CSV file is required.");
  }

  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  if (rows.length === 0) {
    throw new Error("CSV contains no rows.");
  }

  const headerCheck = validateHeaders(headers, SUPERSESSION_HEADERS);
  if (!headerCheck.ok) {
    throw new Error(headerCheck.message);
  }

  const batch = await createBatch("SUPERSESSION", file.name, (session.user as any).id);
  const stagingRows = rows.map((row, index) => ({
    batchId: batch.id,
    rowNumber: index + 1,
    oldPartNo: row["old_part_no"],
    newPartNo: row["new_part_no"],
    reason: row["reason"],
    effectiveDate: row["effective_date"],
    raw: row
  }));

  // LLID: L-ADMIN-016-stage-supersession
  await prisma.stagingSupersession.createMany({ data: stagingRows });

  const errors: Record<string, string>[] = [];
  const incomingEdges: { oldPartNo: string; newPartNo: string }[] = [];

  stagingRows.forEach((row) => {
    const rowErrors: string[] = [];
    const oldPartNo = row.oldPartNo?.trim();
    const newPartNo = row.newPartNo?.trim();
    if (!oldPartNo) {
      rowErrors.push("old_part_no is required.");
    }
    if (!newPartNo) {
      rowErrors.push("new_part_no is required.");
    }
    if (oldPartNo && newPartNo && oldPartNo === newPartNo) {
      rowErrors.push("old_part_no and new_part_no cannot match.");
    }
    if (rowErrors.length > 0) {
      errors.push({ ...row.raw, error_reason: rowErrors.join(" ") });
      return;
    }
    incomingEdges.push({ oldPartNo: oldPartNo!, newPartNo: newPartNo! });
  });

  if (errors.length > 0) {
    const errorCsv = buildErrorCsv(headers, errors, "error_reason");
    const errorPath = await writeErrorCsv(batch.id, errorCsv);
    // LLID: L-ADMIN-017-reject-supersession-batch
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: { status: "REJECTED", errorCsvPath: errorPath }
    });
    return { ok: false, batchId: batch.id };
  }

  const existingEdges = await prisma.supersession.findMany({
    select: { oldPartNo: true, newPartNo: true }
  });

  const rejectedIndexes = detectSupersessionCycles(existingEdges, incomingEdges);
  if (rejectedIndexes.size > 0) {
    const errorRows: Record<string, string>[] = [];
    stagingRows.forEach((row, index) => {
      if (!rejectedIndexes.has(index)) {
        return;
      }
      errorRows.push({
        old_part_no: row.oldPartNo ?? "",
        new_part_no: row.newPartNo ?? "",
        reason: row.reason ?? "",
        effective_date: row.effectiveDate ?? "",
        error_reason: "Cycle detected."
      });
    });

    const errorCsv = buildErrorCsv(headers, errorRows, "error_reason");
    const errorPath = await writeErrorCsv(batch.id, errorCsv);
    // LLID: L-ADMIN-018-reject-supersession-cycles
    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: { status: "REJECTED", errorCsvPath: errorPath }
    });
    return { ok: false, batchId: batch.id };
  }

  const updates = stagingRows.map((row) => {
    const effectiveDate = row.effectiveDate ? new Date(row.effectiveDate) : null;
    const safeDate = effectiveDate && !Number.isNaN(effectiveDate.getTime()) ? effectiveDate : null;
    // LLID: L-ADMIN-019-upsert-supersession
    return prisma.supersession.upsert({
      where: { oldPartNo: row.oldPartNo!.trim() },
      update: {
        newPartNo: row.newPartNo!.trim(),
        reason: row.reason?.trim() || null,
        effectiveDate: safeDate
      },
      create: {
        oldPartNo: row.oldPartNo!.trim(),
        newPartNo: row.newPartNo!.trim(),
        reason: row.reason?.trim() || null,
        effectiveDate: safeDate
      }
    });
  });

  await prisma.$transaction(updates);

  // LLID: L-ADMIN-020-apply-supersession-batch
  await prisma.uploadBatch.update({
    where: { id: batch.id },
    data: { status: "APPLIED" }
  });

  // LLID: L-ADMIN-021-audit-supersession-upload
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action: "upload.supersession",
      metadata: { batchId: batch.id }
    }
  });

  return { ok: true, batchId: batch.id };
}

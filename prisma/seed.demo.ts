import bcrypt from "bcrypt";
// Demo-only seed data for client walkthroughs (safe to re-run).
import {
  Prisma,
  OrderItemStatus,
  OrderStatus,
  OrderLineStatusState,
  PartType,
  PricingTier,
  UploadStatus,
  UploadType
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import { resolveUnitPrice } from "../lib/pricing";

const DEMO_DOMAIN = "demo.local";
const DEMO_PREFIX = "DEMO-";
const DEMO_PASSWORD = "DemoPass123!";
const DEMO_SEED = 424242;

const dealerSeeds = [
  "Northgate Motors",
  "Blue Ridge Auto Group",
  "Summit Autohaus",
  "Lakeside Vehicle Center",
  "Ironwood Automotive",
  "Crestline Dealers",
  "Maple Ridge Autos",
  "Crownline Mobility"
];

const adminSeeds = ["Ava Patel", "Lucas Reed", "Maya Chen"];

const partDescriptors = [
  "Brake Pad Set",
  "Air Filter",
  "Oil Cooler",
  "Suspension Arm",
  "Ignition Coil",
  "Fuel Pump",
  "Timing Chain Kit",
  "Steering Rack",
  "Headlamp Assembly",
  "Radiator Hose",
  "Wheel Bearing",
  "Throttle Body",
  "Catalytic Converter",
  "Spark Plug Set",
  "Control Module"
];

const suppliers = ["Continental", "Bosch", "Delphi", "Denso", "Valeo", "Magneti Marelli"];
const brands = ["Hotbray", "Apex", "Silverline", "Heritage", "PrimeLine", "Vector"];

type DealerTierSet = {
  genuineTier: PricingTier;
  aftermarketTier: PricingTier;
  brandedTier: PricingTier;
};

const tiers: PricingTier[] = ["A", "B", "C", "D", "E", "F"];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(DEMO_SEED);

const randomInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => rng() * (max - min) + min;
const randomChoice = <T,>(items: T[]) => items[Math.floor(rng() * items.length)];

const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

const randomDateWithinDays = (days: number) => {
  const now = Date.now();
  const offset = randomInt(0, days * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
};

async function cleanupDemoData() {
  const superAdminEmail = process.env.SUPERADMIN_EMAIL ?? "";
  // LLID: L-SEED-DEMO-001-clear-order-items
  await prisma.orderItem.deleteMany({
    where: { order: { orderNumber: { startsWith: DEMO_PREFIX } } }
  });
  // LLID: L-SEED-DEMO-002-clear-orders
  await prisma.order.deleteMany({
    where: { orderNumber: { startsWith: DEMO_PREFIX } }
  });
  // LLID: L-SEED-DEMO-003-clear-supersessions
  await prisma.supersession.deleteMany({
    where: {
      OR: [
        { oldPartNo: { startsWith: DEMO_PREFIX } },
        { newPartNo: { startsWith: DEMO_PREFIX } }
      ]
    }
  });
  // LLID: L-SEED-DEMO-004-clear-order-line-status
  await prisma.orderLineStatus.deleteMany({
    where: { accountNo: { startsWith: DEMO_PREFIX } }
  });
  // LLID: L-SEED-DEMO-005-clear-upload-batches
  await prisma.uploadBatch.deleteMany({
    where: { filename: { startsWith: "demo-" } }
  });
  // LLID: L-SEED-DEMO-006-clear-catalog-parts
  await prisma.catalogPart.deleteMany({
    where: { stkNo: { startsWith: DEMO_PREFIX } }
  });
  // LLID: L-SEED-DEMO-007-clear-dealer-profiles
  await prisma.dealerProfile.deleteMany({
    where: { accountNo: { startsWith: DEMO_PREFIX } }
  });
  const userWhere: Prisma.UserWhereInput = { email: { endsWith: `@${DEMO_DOMAIN}` } };
  if (superAdminEmail) {
    userWhere.NOT = { email: superAdminEmail };
  }
  // LLID: L-SEED-DEMO-008-clear-demo-users
  await prisma.user.deleteMany({ where: userWhere });
}

async function seedUsers() {
  const superAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" }
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (let idx = 0; idx < adminSeeds.length; idx += 1) {
    const name = adminSeeds[idx];
    const email = `admin${idx + 1}@${DEMO_DOMAIN}`;
    // LLID: L-SEED-DEMO-009-upsert-admin-user
    await prisma.user.upsert({
      where: { email },
      update: {
        name,
        passwordHash,
        status: "ACTIVE",
        role: "ADMIN",
        mustChangePassword: false,
        passwordUpdatedAt: new Date()
      },
      create: {
        email,
        name,
        passwordHash,
        status: "ACTIVE",
        role: "ADMIN",
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
        createdByUserId: superAdmin?.id ?? null
      }
    });
  }

  const dealerUsers: Array<{
    userId: string;
    profileId: string;
    tiers: DealerTierSet;
    accountNo: string;
    dealerName: string;
  }> = [];

  for (let idx = 0; idx < dealerSeeds.length; idx += 1) {
    const dealerName = dealerSeeds[idx];
    const accountNo = `${DEMO_PREFIX}ACCT-${String(idx + 1).padStart(3, "0")}`;
    const email = `dealer${idx + 1}@${DEMO_DOMAIN}`;
    // LLID: L-SEED-DEMO-010-upsert-dealer-user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: dealerName,
        passwordHash,
        status: "ACTIVE",
        role: "DEALER",
        mustChangePassword: false,
        passwordUpdatedAt: new Date()
      },
      create: {
        email,
        name: dealerName,
        passwordHash,
        status: "ACTIVE",
        role: "DEALER",
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
        createdByUserId: superAdmin?.id ?? null
      }
    });

    const tierSet: DealerTierSet = {
      genuineTier: randomChoice(tiers),
      aftermarketTier: randomChoice(tiers),
      brandedTier: randomChoice(tiers)
    };

    // LLID: L-SEED-DEMO-011-upsert-dealer-profile
    const profile = await prisma.dealerProfile.upsert({
      where: { accountNo },
      update: {
        dealerName,
        genuineTier: tierSet.genuineTier,
        aftermarketTier: tierSet.aftermarketTier,
        brandedTier: tierSet.brandedTier,
        dispatchMethodDefault: randomChoice(["Courier", "Pickup", "Pallet"])
      },
      create: {
        userId: user.id,
        accountNo,
        dealerName,
        genuineTier: tierSet.genuineTier,
        aftermarketTier: tierSet.aftermarketTier,
        brandedTier: tierSet.brandedTier,
        dispatchMethodDefault: randomChoice(["Courier", "Pickup", "Pallet"])
      }
    });

    dealerUsers.push({
      userId: user.id,
      profileId: profile.id,
      tiers: tierSet,
      accountNo,
      dealerName
    });
  }

  return dealerUsers;
}

async function seedCatalog() {
  const parts: Prisma.CatalogPartCreateManyInput[] = [];

  const buildPart = (partType: PartType, index: number) => {
    const base = randomFloat(35, 420);
    const bandA = base;
    const bandB = base * 0.96;
    const bandC = base * 0.92;
    const bandD = base * 0.88;
    const bandE = base * 0.84;
    const bandF = base * 0.8;
    const minimumPrice = base * 0.78;
    const supplier = randomChoice(suppliers);
    const brand = partType === "AFTERMARKET" ? randomChoice(brands) : partType === "BRANDED" ? "Hotbray" : "OEM";

    return {
      stkNo: `${DEMO_PREFIX}${partType[0]}-${String(index + 1).padStart(4, "0")}`,
      manufacturer: "Hotbray",
      landRoverNo: `LR-${randomInt(10000, 99999)}`,
      jaguarNo: `JAG-${randomInt(10000, 99999)}`,
      supplier,
      brand,
      oem: `OEM-${randomInt(1000, 9999)}`,
      description: `${randomChoice(partDescriptors)} (${partType.toLowerCase()})`,
      freeStock: randomInt(0, 140),
      tradePrice: toDecimal(base * 0.9),
      bandA: toDecimal(bandA),
      bandB: toDecimal(bandB),
      bandC: toDecimal(bandC),
      bandD: toDecimal(bandD),
      bandE: toDecimal(bandE),
      bandF: toDecimal(bandF),
      minimumPrice: toDecimal(minimumPrice),
      tariffCode: `TC${randomInt(1000, 9999)}`,
      countryOfOrigin: randomChoice(["UK", "DE", "US", "JP", "FR"]),
      barcode: String(randomInt(100000000, 999999999)),
      imageUrl: null,
      partType,
      isActive: true,
      lastSeenAt: new Date()
    };
  };

  const categories: Array<{ type: PartType; count: number }> = [
    { type: "GENUINE", count: 40 },
    { type: "AFTERMARKET", count: 50 },
    { type: "BRANDED", count: 30 }
  ];

  categories.forEach(({ type, count }) => {
    for (let idx = 0; idx < count; idx += 1) {
      parts.push(buildPart(type, idx + 1));
    }
  });

  // LLID: L-SEED-DEMO-012-create-demo-catalog-parts
  await prisma.catalogPart.createMany({ data: parts });
}

async function seedSupersessions() {
  const parts = await prisma.catalogPart.findMany({
    where: { stkNo: { startsWith: DEMO_PREFIX } }
  });
  if (parts.length < 10) return;

  const supersessions: Prisma.SupersessionCreateManyInput[] = [];
  const usedOlds = new Set<string>();

  for (let idx = 0; idx < 12; idx += 1) {
    let oldPart = randomChoice(parts);
    let newPart = randomChoice(parts);
    let attempts = 0;
    while ((oldPart.stkNo === newPart.stkNo || usedOlds.has(oldPart.stkNo)) && attempts < 10) {
      oldPart = randomChoice(parts);
      newPart = randomChoice(parts);
      attempts += 1;
    }
    if (oldPart.stkNo === newPart.stkNo || usedOlds.has(oldPart.stkNo)) {
      continue;
    }
    usedOlds.add(oldPart.stkNo);
    const effectiveDate =
      rng() < 0.7 ? randomDateWithinDays(60) : new Date(Date.now() + randomInt(7, 28) * 86400000);
    supersessions.push({
      oldPartNo: oldPart.stkNo,
      newPartNo: newPart.stkNo,
      reason: randomChoice(["Supplier change", "Design update", "Superseded by OEM", "Improved fitment"]),
      effectiveDate
    });
  }

  if (supersessions.length > 0) {
    // LLID: L-SEED-DEMO-013-create-demo-supersessions
    await prisma.supersession.createMany({ data: supersessions });
  }
}

async function seedOrders(
  dealers: Array<{ userId: string; profileId: string; tiers: DealerTierSet; accountNo: string; dealerName: string }>
) {
  const parts = await prisma.catalogPart.findMany({
    where: { stkNo: { startsWith: DEMO_PREFIX } }
  });

  for (let idx = 0; idx < 150; idx += 1) {
    const dealer = randomChoice(dealers);
    const orderNumber = `${DEMO_PREFIX}ORD-${String(idx + 1).padStart(5, "0")}`;
    const createdAt = randomDateWithinDays(90);
    const itemsCount = randomInt(2, 5);
    const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    const lineStatuses: Prisma.OrderLineStatusCreateManyInput[] = [];

    let totalAmount = new Prisma.Decimal(0);
    let hasBackorder = false;
    let allShipped = true;

    for (let line = 0; line < itemsCount; line += 1) {
      const part = randomChoice(parts);
      const { tier, unitPrice } = resolveUnitPrice(part, dealer.tiers);
      const qty = randomInt(1, 6);
      const lineTotal = unitPrice.mul(qty);
      totalAmount = totalAmount.add(lineTotal);

      let shippedQty: number | null = null;
      let backorderedQty: number | null = null;
      let status: OrderItemStatus = "PENDING";

      const backorderChance = rng();
      if (backorderChance < 0.12) {
        backorderedQty = randomInt(1, qty);
        shippedQty = qty - backorderedQty;
        status = shippedQty > 0 ? "PARTIALLY_SHIPPED" : "BACKORDERED";
        hasBackorder = true;
        allShipped = false;
      } else if (backorderChance < 0.65) {
        status = "PENDING";
        allShipped = false;
      } else {
        status = "SHIPPED";
        shippedQty = qty;
      }

      items.push({
        partId: part.id,
        partStkNo: part.stkNo,
        description: part.description,
        qty,
        unitPrice,
        lineTotal,
        priceTier: tier,
        priceCategory: part.partType,
        status,
        shippedQty,
        backorderedQty,
        updatedAt: createdAt
      });

      const lineStatus: OrderLineStatusState =
        status === "SHIPPED"
          ? "FULFILLED"
          : status === "PARTIALLY_SHIPPED"
            ? "PARTIALLY_FULFILLED"
            : status === "BACKORDERED"
              ? "BACKORDERED"
              : "OPEN";

      lineStatuses.push({
        orderId: "",
        accountNo: dealer.accountNo,
        partNumber: part.stkNo,
        orderedQty: qty,
        fulfilledQty: shippedQty ?? null,
        backorderedQty: backorderedQty ?? null,
        status: lineStatus,
        statusDate: createdAt,
        sourceBatchId: null
      });
    }

    let status: OrderStatus = "PROCESSING";
    if (hasBackorder) {
      status = rng() < 0.2 ? "SUSPENDED" : "ON_HOLD";
    } else if (allShipped) {
      status = rng() < 0.5 ? "COMPLETED" : "SHIPPED";
    }

    // LLID: L-SEED-DEMO-014-create-demo-order
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: dealer.userId,
        dealerAccountNo: dealer.accountNo,
        status,
        currency: "GBP",
        totalAmount,
        createdAt,
        updatedAt: createdAt,
        items: { create: items }
      }
    });

    if (lineStatuses.length > 0) {
      const uniqueStatuses = new Map<string, Prisma.OrderLineStatusCreateManyInput>();
      lineStatuses.forEach((row) => {
        uniqueStatuses.set(row.partNumber, row);
      });
      // LLID: L-SEED-DEMO-015-create-demo-line-status
      await prisma.orderLineStatus.createMany({
        data: Array.from(uniqueStatuses.values()).map((row) => ({ ...row, orderId: createdOrder.id })),
        skipDuplicates: true
      });
    }
  }
}

async function seedUploadBatches() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" }
  });

  if (!admin) return;

  const uploads: Prisma.UploadBatchCreateManyInput[] = [];
  const types: UploadType[] = ["PARTS_AFTERMARKET", "PARTS_GENUINE", "SUPERSESSION", "ORDER_STATUS"];

  for (let idx = 0; idx < 10; idx += 1) {
    const type = types[idx % types.length];
    const status: UploadStatus = rng() < 0.2 ? "REJECTED" : "APPLIED";
    const createdAt = randomDateWithinDays(90);
    uploads.push({
      type,
      filename: `demo-${type.toLowerCase()}-${String(idx + 1).padStart(2, "0")}.csv`,
      status,
      errorCsvPath: status === "REJECTED" ? `demo-errors/${type.toLowerCase()}-${idx + 1}.csv` : null,
      uploadedById: admin.id,
      createdAt
    });
  }

  // LLID: L-SEED-DEMO-016-create-demo-upload-batches
  await prisma.uploadBatch.createMany({ data: uploads });
}

async function main() {
  await cleanupDemoData();
  const dealers = await seedUsers();
  await seedCatalog();
  await seedSupersessions();
  await seedOrders(dealers);
  await seedUploadBatches();
  console.log("Demo seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

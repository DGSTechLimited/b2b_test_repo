import bcrypt from "bcrypt";
import * as XLSX from "xlsx";
import { PricingTier } from "@prisma/client";
import { prisma } from "../lib/prisma";

const DEFAULT_PASSWORD = "TempPass123!";

const resolveTier = (value: string): PricingTier => {
  const normalized = value.trim();
  if (!normalized) return "A";
  const upper = normalized.toUpperCase();
  if (["A", "B", "C", "D", "E", "F"].includes(upper)) {
    return upper as PricingTier;
  }
  const match = normalized.toLowerCase().match(/net\s*(\d+)/);
  if (match) {
    const tierMap: Record<string, PricingTier> = {
      "1": "A",
      "2": "B",
      "3": "C",
      "4": "D",
      "5": "E",
      "6": "F",
      "7": "F"
    };
    return tierMap[match[1]] ?? "A";
  }
  return "A";
};

const resolveStatus = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === "inactive" || normalized === "disabled" ? "INACTIVE" : "ACTIVE";
};

async function main() {
  const inputPath = process.argv[2] ?? "mnt/data/Dealer_Accounts_Sample_30_NetTiers.xlsx";
  const workbook = XLSX.readFile(inputPath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: "", raw: false });

  if (rows.length === 0) {
    console.error("No rows found in dealer workbook.");
    process.exit(1);
  }

  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" }
  });

  let createdUsers = 0;
  let updatedUsers = 0;
  let createdProfiles = 0;
  let updatedProfiles = 0;
  const errors: Array<{ row: number; message: string }> = [];

  for (let idx = 0; idx < rows.length; idx += 1) {
    const row = rows[idx];
    const accountNo = String(row["Account Number"] ?? "").trim();
    const companyName = String(row["Company Name"] ?? "").trim();
    const firstName = String(row["First Name"] ?? "").trim();
    const lastName = String(row["Last Name"] ?? "").trim();
    const email = String(row["Email"] ?? "").toLowerCase().trim();
    const tempPassword = String(row["Temp password"] ?? "").trim();
    const status = resolveStatus(String(row["Status"] ?? ""));
    const dispatchMethodDefault = String(row["Default shipping Method"] ?? "").trim();

    if (!accountNo) {
      errors.push({ row: idx + 2, message: "Account Number is required." });
      continue;
    }
    if (!email) {
      errors.push({ row: idx + 2, message: "Email is required." });
      continue;
    }

    const dealerName = companyName || [firstName, lastName].filter(Boolean).join(" ") || email;
    const userName = [firstName, lastName].filter(Boolean).join(" ") || dealerName;

    const genuineTier = resolveTier(String(row["Genuine Parts Tier"] ?? ""));
    const aftermarketTier = resolveTier(String(row["Aftermarket ES Tier"] ?? ""));
    const brandedTier = resolveTier(String(row["Aftermarket B Tier"] ?? ""));

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingProfile = await prisma.dealerProfile.findUnique({
      where: { accountNo },
      select: { userId: true }
    });

    if (existingProfile && existingUser && existingProfile.userId !== existingUser.id) {
      errors.push({
        row: idx + 2,
        message: `Account ${accountNo} is linked to a different user than ${email}.`
      });
      continue;
    }

    let userId: string;
    if (existingUser) {
      // LLID: L-SCRIPT-001-update-dealer-user
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: userName,
          status,
          role: "DEALER"
        }
      });
      updatedUsers += 1;
      userId = existingUser.id;
    } else {
      const passwordHash = await bcrypt.hash(tempPassword || DEFAULT_PASSWORD, 12);
      // LLID: L-SCRIPT-002-create-dealer-user
      const created = await prisma.user.create({
        data: {
          email,
          name: userName,
          passwordHash,
          role: "DEALER",
          status,
          mustChangePassword: true,
          passwordUpdatedAt: new Date(),
          createdByUserId: adminUser?.id ?? null
        }
      });
      createdUsers += 1;
      userId = created.id;
    }

    const profileExists = Boolean(existingProfile);
    // LLID: L-SCRIPT-003-upsert-dealer-profile
    await prisma.dealerProfile.upsert({
      where: { accountNo },
      update: {
        userId,
        dealerName,
        genuineTier,
        aftermarketTier,
        brandedTier,
        dispatchMethodDefault: dispatchMethodDefault || null
      },
      create: {
        userId,
        accountNo,
        dealerName,
        genuineTier,
        aftermarketTier,
        brandedTier,
        dispatchMethodDefault: dispatchMethodDefault || null
      }
    });

    if (profileExists) {
      updatedProfiles += 1;
    } else {
      createdProfiles += 1;
    }
  }

  console.log(
    `Dealer import complete. Users created: ${createdUsers}, users updated: ${updatedUsers}, profiles created: ${createdProfiles}, profiles updated: ${updatedProfiles}.`
  );

  if (errors.length > 0) {
    console.error("Validation errors:");
    errors.forEach((error) => {
      console.error(`Row ${error.row}: ${error.message}`);
    });
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { disconnectDealerImportDb, runDealerImport } from "@/lib/db/import-dealers";

async function main() {
  const inputPath = process.argv[2] ?? "mnt/data/Dealer_Accounts_Sample_30_NetTiers.xlsx";
  const summary = await runDealerImport(inputPath);

  console.log(
    `Dealer import complete. Users created: ${summary.createdUsers}, users updated: ${summary.updatedUsers}, profiles created: ${summary.createdProfiles}, profiles updated: ${summary.updatedProfiles}.`
  );

  if (summary.errors.length > 0) {
    console.error("Validation errors:");
    summary.errors.forEach((error) => {
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
    await disconnectDealerImportDb();
  });

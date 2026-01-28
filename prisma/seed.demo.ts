import { disconnectDemoSeedDb, runDemoSeed } from "@/lib/db/seed-demo";

runDemoSeed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDemoSeedDb();
  });

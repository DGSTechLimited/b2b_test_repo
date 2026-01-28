import { disconnectSeedDb, runSeed } from "@/lib/db/seed";

runSeed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectSeedDb();
  });

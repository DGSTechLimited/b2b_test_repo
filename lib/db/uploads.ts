import { prisma } from "@/lib/db/prisma";

export async function getUploadBatchErrorPath(batchId: string) {
  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    select: { errorCsvPath: true }
  });
  return batch?.errorCsvPath ?? null;
}

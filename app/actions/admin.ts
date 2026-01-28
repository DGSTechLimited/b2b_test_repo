"use server";

import { UploadType } from "@prisma/client";
import {
  createDealerDb,
  uploadOrderStatusDb,
  uploadPartsDb,
  uploadSupersessionDb
} from "@/lib/db/admin-actions";
import { requireRole } from "@/lib/require-auth";

export type DealerFormState = {
  ok: boolean;
  error?: string;
};

export async function createDealer(
  _prevState: DealerFormState,
  formData: FormData
): Promise<DealerFormState> {
  const session = await requireRole("ADMIN");
  return createDealerDb(formData, (session.user as any).id);
}

export async function uploadParts(
  formData: FormData,
  uploadType: UploadType,
  allowedCategories: Array<"AFTERMARKET" | "GENUINE" | "BRANDED">
) {
  const session = await requireRole("ADMIN");
  return uploadPartsDb(formData, uploadType, allowedCategories, (session.user as any).id);
}

export async function uploadPartsAftermarket(formData: FormData) {
  return uploadParts(formData, "PARTS_AFTERMARKET", ["AFTERMARKET"]);
}

export async function uploadPartsGenuine(formData: FormData) {
  return uploadParts(formData, "PARTS_GENUINE", ["GENUINE", "BRANDED"]);
}

export async function uploadOrderStatus(formData: FormData) {
  const session = await requireRole("ADMIN");
  return uploadOrderStatusDb(formData, (session.user as any).id);
}

export async function uploadSupersession(formData: FormData) {
  const session = await requireRole("ADMIN");
  return uploadSupersessionDb(formData, (session.user as any).id);
}

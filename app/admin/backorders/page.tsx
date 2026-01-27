import { uploadOrderStatus } from "@/app/actions/admin";
import { BackordersClient } from "./BackordersClient";

export default async function BackordersPage() {
  return <BackordersClient onUpload={uploadOrderStatus} />;
}

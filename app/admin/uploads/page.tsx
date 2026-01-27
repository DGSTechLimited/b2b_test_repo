import { uploadOrderStatus, uploadPartsAftermarket, uploadPartsGenuine, uploadSupersession } from "@/app/actions/admin";
import { UploadsClient } from "./UploadsClient";

export default async function UploadsPage() {
  return (
    <UploadsClient
      onUploadPartsAftermarket={uploadPartsAftermarket}
      onUploadPartsGenuine={uploadPartsGenuine}
      onUploadOrderStatus={uploadOrderStatus}
      onUploadSupersession={uploadSupersession}
    />
  );
}


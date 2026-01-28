import { ContactSupportClient } from "./ContactSupportClient";
import { requireRole } from "@/lib/require-auth";
import { getDealerAccountNoForSupport } from "@/lib/db/contact-support";

export default async function ContactSupportPage() {
  const attachmentEnabled = process.env.ENABLE_SUPPORT_ATTACHMENT === "true";
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const accountNo = await getDealerAccountNoForSupport(userId);

  return (
    <ContactSupportClient
      attachmentEnabled={attachmentEnabled}
      accountNumber={accountNo ?? ""}
    />
  );
}

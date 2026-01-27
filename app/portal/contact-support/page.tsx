import { ContactSupportClient } from "./ContactSupportClient";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/require-auth";

export default async function ContactSupportPage() {
  const attachmentEnabled = process.env.ENABLE_SUPPORT_ATTACHMENT === "true";
  const session = await requireRole("DEALER");
  const userId = (session.user as any).id as string;
  const dealerProfile = await prisma.dealerProfile.findUnique({
    where: { userId },
    select: { accountNo: true }
  });

  return (
    <ContactSupportClient
      attachmentEnabled={attachmentEnabled}
      accountNumber={dealerProfile?.accountNo ?? ""}
    />
  );
}

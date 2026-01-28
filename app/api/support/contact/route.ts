import { NextResponse } from "next/server";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { requireRole } from "@/lib/require-auth";
import { createSupportAuditLog, getDealerAccountNoForSupport } from "@/lib/db/contact-support";

const supportSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  accountNumber: z.string().min(2),
  subject: z.string().min(2),
  message: z.string().min(2)
});

const attachmentEnabled = process.env.ENABLE_SUPPORT_ATTACHMENT === "true";
const maxAttachmentSize = 5 * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"]);
const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function POST(request: Request) {
  let session;
  try {
    session = await requireRole("DEALER");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const accountNo = await getDealerAccountNoForSupport(userId);

  if (!accountNo) {
    return NextResponse.json({ message: "Dealer not found." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, string> = {
    name: "",
    email: "",
    accountNumber: accountNo,
    subject: "",
    message: ""
  };
  let attachment: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      accountNumber: accountNo,
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? "")
    };
    const fileEntry = formData.get("attachment");
    if (fileEntry instanceof File) {
      attachment = fileEntry;
    }
  } else {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object") {
      payload = {
        name: String(body.name ?? ""),
        email: String(body.email ?? ""),
        accountNumber: accountNo,
        subject: String(body.subject ?? ""),
        message: String(body.message ?? "")
      };
    }
  }

  const parsed = supportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  let attachmentMeta: {
    filename: string;
    storedPath: string;
    size: number;
    contentType: string;
  } | null = null;

  if (attachment) {
    if (!attachmentEnabled) {
      return NextResponse.json({ message: "Attachments are not enabled." }, { status: 400 });
    }
    if (attachment.size > maxAttachmentSize) {
      return NextResponse.json(
        { message: "Attachment exceeds the 5MB limit." },
        { status: 400 }
      );
    }
    const extension = path.extname(attachment.name).toLowerCase();
    if (!allowedExtensions.has(extension) && !allowedMimeTypes.has(attachment.type)) {
      return NextResponse.json(
        { message: "Unsupported attachment type." },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "uploads", "support");
    await fs.mkdir(uploadDir, { recursive: true });
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storedName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const storedPath = path.join(uploadDir, storedName);
    const buffer = Buffer.from(await attachment.arrayBuffer());
    await fs.writeFile(storedPath, buffer);

    attachmentMeta = {
      filename: attachment.name,
      storedPath,
      size: attachment.size,
      contentType: attachment.type
    };
  }

  await createSupportAuditLog(userId, {
    ...parsed.data,
    attachment: attachmentMeta,
    submittedBy: session.user?.email ?? null
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

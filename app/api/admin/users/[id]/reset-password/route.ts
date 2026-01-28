import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { requireRole } from "@/lib/require-auth";
import { getUserWithProfile, resetUserPassword } from "@/lib/db/admin-users";

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedPassword = typeof body.password === "string" ? body.password.trim() : "";
  if (requestedPassword && requestedPassword.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const user = await getUserWithProfile(params.id);
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const tempPassword = requestedPassword || generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await resetUserPassword(params.id, passwordHash);

  return NextResponse.json({ ok: true, tempPassword });
}

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";
import { requireSession } from "@/lib/require-auth";
import { getUserProfileById, updateUserPassword } from "@/lib/db/me";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8)
});

export async function POST(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  const userId = (session.user as any).id as string;
  const user = await getUserProfileById(userId);
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (!user.mustChangePassword) {
    if (!currentPassword) {
      return NextResponse.json({ message: "Current password is required." }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUserPassword(userId, passwordHash, false, new Date());

  return NextResponse.json({ ok: true });
}

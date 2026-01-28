import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { requireRole } from "@/lib/require-auth";
import {
  createUserWithProfile,
  findDealerProfileByAccountNo,
  findUserByEmail,
  listUsers
} from "@/lib/db/admin-users";

const createSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("ADMIN"),
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    status: z.enum(["ACTIVE", "INACTIVE"])
  }),
  z.object({
    role: z.literal("DEALER"),
    dealerName: z.string().min(2),
    accountNo: z.string().min(2),
    genuineTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    aftermarketTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    brandedTier: z.enum(["A", "B", "C", "D", "E", "F"]),
    email: z.string().email(),
    password: z.string().min(8),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    dispatchMethodDefault: z.string().optional().nullable()
  })
]);

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const rawType = searchParams.get("type") ?? "ALL";
  const type = rawType.toUpperCase();
  const status = searchParams.get("status") ?? "ALL";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const where: any = {};

  if (type === "ADMIN" || type === "DEALER") {
    where.role = type;
  }

  if (status === "ACTIVE" || status === "INACTIVE" || status === "SUSPENDED") {
    if (type === "DEALER") {
      where.dealerProfile = { status };
    } else {
      where.status = status;
    }
  }

  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { dealerProfile: { accountNo: { contains: query, mode: "insensitive" } } },
      { dealerProfile: { dealerName: { contains: query, mode: "insensitive" } } }
    ];
  }

  const [total, users] = await listUsers(where, page, pageSize);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      status: user.role === "DEALER" ? user.dealerProfile?.status ?? "ACTIVE" : user.status,
      accountNo: user.dealerProfile?.accountNo ?? null,
      genuineTier: user.dealerProfile?.genuineTier ?? null,
      aftermarketTier: user.dealerProfile?.aftermarketTier ?? null,
      brandedTier: user.dealerProfile?.brandedTier ?? null,
      dealerName: user.dealerProfile?.dealerName ?? null,
      createdBy: user.createdBy?.email ?? user.createdBy?.name ?? null,
      createdAt: user.createdAt.toISOString()
    })),
    page,
    pageSize,
    total,
    totalPages
  });
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireRole("ADMIN");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return NextResponse.json(
      { message: "Email already in use.", fieldErrors: { email: "Email already in use." } },
      { status: 400 }
    );
  }

  if (data.role === "DEALER") {
    const accountExists = await findDealerProfileByAccountNo(data.accountNo.trim());
    if (accountExists) {
      return NextResponse.json(
        { message: "Account No already in use.", fieldErrors: { accountNo: "Account No already in use." } },
        { status: 400 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const createdByUserId = (session.user as any).id as string;
  const userStatus =
    data.role === "DEALER"
      ? data.status === "INACTIVE"
        ? "INACTIVE"
        : "ACTIVE"
      : data.status;

  await createUserWithProfile({
    email: normalizedEmail,
    passwordHash,
    role: data.role,
    status: userStatus,
    name: data.role === "ADMIN" ? data.name.trim() : data.dealerName.trim(),
    mustChangePassword: true,
    createdByUserId,
    dealerProfile:
      data.role === "DEALER"
        ? {
            create: {
              accountNo: data.accountNo.trim(),
              dealerName: data.dealerName.trim(),
              genuineTier: data.genuineTier,
              aftermarketTier: data.aftermarketTier,
              brandedTier: data.brandedTier,
              status: data.status,
              dispatchMethodDefault: data.dispatchMethodDefault?.trim() || null
            }
          }
        : undefined
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

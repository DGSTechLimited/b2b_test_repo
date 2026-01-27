import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "DEALER";
      genuineTier?: string | null;
      aftermarketTier?: string | null;
      brandedTier?: string | null;
      dealerStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
      accountNo?: string | null;
      mustChangePassword?: boolean;
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "DEALER";
    genuineTier?: string | null;
    aftermarketTier?: string | null;
    brandedTier?: string | null;
    dealerStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | null;
    accountNo?: string | null;
    mustChangePassword?: boolean;
    name?: string | null;
  }
}

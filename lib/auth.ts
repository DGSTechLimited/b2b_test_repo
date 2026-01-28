import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;
        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { dealerProfile: true }
        });

        if (!user || user.status !== "ACTIVE") {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        // LLID: L-LIB-001-update-last-login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          dealerStatus: user.dealerProfile?.status ?? null,
          genuineTier: user.dealerProfile?.genuineTier ?? null,
          aftermarketTier: user.dealerProfile?.aftermarketTier ?? null,
          brandedTier: user.dealerProfile?.brandedTier ?? null,
          accountNo: user.dealerProfile?.accountNo ?? null,
          mustChangePassword: user.mustChangePassword
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.genuineTier = (user as any).genuineTier;
        token.aftermarketTier = (user as any).aftermarketTier;
        token.brandedTier = (user as any).brandedTier;
        token.dealerStatus = (user as any).dealerStatus;
        token.accountNo = (user as any).accountNo;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.name = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).genuineTier = token.genuineTier;
        (session.user as any).aftermarketTier = token.aftermarketTier;
        (session.user as any).brandedTier = token.brandedTier;
        (session.user as any).dealerStatus = token.dealerStatus;
        (session.user as any).accountNo = token.accountNo;
        (session.user as any).mustChangePassword = token.mustChangePassword;
        (session.user as any).name = token.name;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  }
};

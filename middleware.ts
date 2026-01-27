import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/login") || pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/portal") && !pathname.startsWith("/profile")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token.role === "DEALER" && token.dealerStatus && token.dealerStatus !== "ACTIVE") {
    const error =
      token.dealerStatus === "SUSPENDED" ? "dealer_suspended" : "dealer_inactive";
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/portal/parts", request.url));
  }

  if (pathname.startsWith("/portal") && token.role !== "DEALER") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/profile"]
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Filtrage optimiste : on ne lit que la présence du cookie, sans appel DB
 * (déconseillé dans le proxy). La vraie vérification de session se fait
 * dans le DAL — voir lib/dal.ts.
 */
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/stats/:path*",
    "/players/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/login",
  ],
};

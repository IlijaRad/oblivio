import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTHENTICATION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  if (request.headers.has("next-action")) {
    return NextResponse.next();
  }

  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Match all routes EXCEPT:
      - static files
      - _next
      - images
      - favicon
    */
    "/((?!_next|favicon.ico|logo.png|logo-dark.png|.*\\.(?:png|jpg|jpeg|svg|webp)).*)",
  ],
};

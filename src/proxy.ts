import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { NextResponse, type NextRequest } from "next/server";

const DEVICE_ID_KEY = "device_id";

function generateDeviceId() {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return (
      "dev_" +
      Array.from(arr)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return (
      "dev_" +
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2)
    );
  }
}

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

  const response = NextResponse.next();

  const deviceId = request.cookies.get(DEVICE_ID_KEY);
  if (!deviceId) {
    const newDeviceId = generateDeviceId();
    response.cookies.set(DEVICE_ID_KEY, newDeviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
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

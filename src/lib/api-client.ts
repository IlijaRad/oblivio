import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class LicenseRequiredError extends Error {
  constructor() {
    super("Active license required");
    this.name = "LicenseRequiredError";
  }
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    const msg: string = Array.isArray(data?.message)
      ? data.message.join(" ")
      : String(data?.message || "");
    if (msg.toLowerCase().includes("active license")) {
      throw new LicenseRequiredError();
    }
  }

  return response;
}

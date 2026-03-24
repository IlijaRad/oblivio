"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";

export interface CurrentLicense {
  licenseId: string;
  activatedAt: string;
  expiresAt: string;
  startsAt: string | null;
  endsAt: string | null;
  applicationId: string | null;
}

export async function getCurrentLicense(): Promise<
  CurrentLicense | null | { error: string }
> {
  try {
    const response = await apiClient("/licenses/me/current");
    if (response.status === 404) return null;
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Cannot load current license" };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "Unauthorized" };
    return { error: "Cannot load current license" };
  }
}

export async function activateLicense(
  token: string,
): Promise<{ expiresAt: string } | { error: string }> {
  try {
    const clean = token.trim();
    if (!clean) return { error: "Please enter a token" };

    const response = await apiClient("/licenses/activate", {
      method: "POST",
      body: JSON.stringify({ token: clean }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const msg = data?.message;
      const normalized = Array.isArray(msg)
        ? msg.join(", ")
        : typeof msg === "string" && msg.trim()
          ? msg
          : "Activation failed";
      return { error: normalized };
    }

    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { error: "Unauthorized" };
    return { error: "Activation failed" };
  }
}

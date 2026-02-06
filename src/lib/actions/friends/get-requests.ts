"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

async function getAuthHeaders() {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";
  return { ...headers, Authorization: `Bearer ${bearer}` };
}

export async function getFullFriendRequests() {
  const headers = await getAuthHeaders();
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/friends/requests`,
      {
        method: "GET",
        headers,
        next: { tags: ["friend-requests"] },
      },
    );
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

export async function respondToFriendRequest(
  requestId: string,
  action: "accept" | "decline",
) {
  const headers = await getAuthHeaders();

  // Accept: POST /friends/requests/:id/accept
  // Decline: DELETE /friends/requests/:id
  const url =
    action === "accept"
      ? `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/${requestId}/accept`
      : `${process.env.NEXT_PUBLIC_API_URL}/friends/requests/${requestId}`;

  const method = action === "accept" ? "POST" : "DELETE";

  try {
    const response = await fetch(url, { method, headers });

    if (response.ok) {
      updateTag("friend-requests");
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return { error: data.message || `Failed to ${action} request` };
  } catch {
    return { error: "Service error. Please try again." };
  }
}

"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";
import { updateTag } from "next/cache";

export async function getFullFriendRequests() {
  try {
    const response = await apiClient("/friends/requests", {
      method: "GET",
      next: { tags: ["friend-requests"] },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }
    return [];
  }
}

export async function respondToFriendRequest(
  requestId: string,
  action: "accept" | "decline",
) {
  const endpoint =
    action === "accept"
      ? `/friends/requests/${requestId}/accept`
      : `/friends/requests/${requestId}`;

  const method = action === "accept" ? "POST" : "DELETE";

  try {
    const response = await apiClient(endpoint, { method });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || `Failed to ${action} request` };
    }

    updateTag("friend-requests");
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }
    return { error: "Service error. Please try again." };
  }
}

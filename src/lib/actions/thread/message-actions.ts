"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";

export async function editMessage(messageId: string, body: string) {
  try {
    const response = await apiClient(`/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to edit message" };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const response = await apiClient(`/messages/${messageId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to delete message" };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

export async function addMessageReaction(messageId: string, emoji: string) {
  try {
    const response = await apiClient(`/messages/${messageId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { error: data.message || "Failed to add reaction" };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof UnauthorizedError) return { unauthorized: true };
    return { error: "Network error" };
  }
}

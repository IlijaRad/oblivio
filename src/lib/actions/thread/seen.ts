"use server";

import { apiClient } from "@/lib/api-client";

export async function markAsSeen(contactId: string, upTo: number) {
  try {
    await apiClient("/messages/seen", {
      method: "POST",
      body: JSON.stringify({
        with: contactId,
        upTo: upTo,
      }),
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

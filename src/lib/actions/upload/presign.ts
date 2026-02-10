"use server";

import { apiClient } from "@/lib/api-client";

export async function getPresignedUploadUrl(payload: {
  folder: string;
  contentType: string;
  contentLength: number;
}) {
  try {
    const response = await apiClient("/uploads/presign", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { error: "Failed to get presigned URL" };
    }

    return await response.json();
  } catch (error) {
    console.error("Presign error:", error);
    return { error: "Internal server error" };
  }
}

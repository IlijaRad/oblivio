"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function sendMessage(
  toUserId: string,
  body: string,
  deviceId: string,
) {
  const headers = await getDefaultHeaders();
  const bearer = (await cookies()).get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages`,
      {
        method: "POST",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toUserId,
          body,
          deviceId,
        }),
      },
    );

    if (response.status !== 201) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || "Failed to send message" };
    }

    return await response.json();
  } catch {
    return { error: "Network error, please try again." };
  }
}

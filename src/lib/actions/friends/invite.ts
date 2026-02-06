"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function invite(token: string) {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/friends/use-invite`,
      {
        method: "POST",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { error: errorData.message || "Invite invalid or expired" };
    }

    return { success: true };
  } catch {
    return { error: "Service unavailable, please try again later." };
  }
}

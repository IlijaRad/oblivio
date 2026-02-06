"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function deleteContact(userId: string) {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/friends/${userId}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (response.ok) {
      updateTag("friends");
      updateTag("contacts");
      return { success: true };
    }

    const data = await response.json().catch(() => ({}));
    return { error: data.message || "Failed to remove contact" };
  } catch {
    return { error: "Service error, please try again." };
  }
}

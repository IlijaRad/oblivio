"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function addFriend(username: string) {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
      method: "POST",
      headers: {
        ...headers,
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });

    if (response.status === 201) {
      updateTag("contacts");
      updateTag("friend-requests");
      return { success: true };
    }

    const data = await response.json();
    return { error: data.message || "Failed to send friend request" };
  } catch {
    return { error: "Service error. Please try again." };
  }
}

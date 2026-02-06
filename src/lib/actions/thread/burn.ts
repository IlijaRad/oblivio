"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function burnChat(userId: string) {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/thread/${userId}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (response.status === 200) {
      return { success: true };
    }
  } catch {
    return {
      errors: {
        general: ["An error has occured, please try again."],
      },
    };
  }
}

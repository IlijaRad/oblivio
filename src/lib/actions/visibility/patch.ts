"use server";

import { AUTHENTICATION_COOKIE_NAME, FormState } from "@/lib/definitions";
import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export async function changeProfileVisibility(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const isSearchable = formData.get("visibility") === "true";

  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/visibility`,
      {
        method: "PATCH",
        body: JSON.stringify({ isSearchable }),
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return {
        errors: { server: [data.message || "Failed to update visibility."] },
      };
    }

    updateTag("/profile");
    return null;
  } catch {
    return {
      errors: { server: ["Service unavailable. Please try again later."] },
    };
  }
}

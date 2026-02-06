"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

async function getAuthHeaders() {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  return {
    ...headers,
    Authorization: `Bearer ${bearer}`,
  };
}

export async function getAvatarPresignedUrl(
  contentType: string,
  contentLength: number,
) {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar/presign`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ contentType, contentLength }),
      },
    );

    if (!response.ok) throw new Error("Failed to get presigned URL");

    return await response.json();
  } catch (error) {
    console.error(error);
    return { error: "Failed to authorize upload" };
  }
}

export async function updateAvatarKey(key: string) {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/avatar`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ key }),
      },
    );

    if (!response.ok) throw new Error("Failed to update avatar key");

    revalidatePath("profile");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save profile picture" };
  }
}

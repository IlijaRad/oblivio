"use server";

import { AUTHENTICATION_COOKIE_NAME, FormState } from "@/lib/definitions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultHeaders } from "../headers";

export async function changePassword(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const oldPassword = formData.get("oldPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return { errors: { server: ["All fields are required."] } };
  }

  if (newPassword !== confirmPassword) {
    return { errors: { server: ["New passwords do not match."] } };
  }

  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/password`,
      {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (response.status !== 201) {
      const data = await response.json();
      return {
        errors: { server: [data.message || "Failed to change password."] },
      };
    }

    const cookieStore = await cookies();
    cookieStore.delete(AUTHENTICATION_COOKIE_NAME);
  } catch {
    return { errors: { server: ["An error has occurred, please try again."] } };
  }

  redirect("/login");
}

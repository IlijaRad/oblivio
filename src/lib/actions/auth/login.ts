"use server";

import { AUTHENTICATION_COOKIE_NAME, FormState } from "@/lib/definitions";
import { isProduction } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDefaultHeaders } from "../headers";

export async function login(_: FormState, formData: FormData) {
  const identifier = formData.get("username") || formData.get("email");
  const password = formData.get("password") as string;

  if (!identifier || !password) {
    return {
      errors: { server: ["Credentials are required."] },
    };
  }

  const headers = await getDefaultHeaders();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
        headers,
      },
    );

    if (response.status !== 201) {
      const data = await response.json();
      return {
        errors: { server: [data.message || "Invalid credentials"] },
        inputs: { email: identifier as string },
      };
    }

    const payload = await response.json();
    const cookieStore = await cookies();

    cookieStore.set({
      name: AUTHENTICATION_COOKIE_NAME,
      value: payload?.accessToken as string,
      httpOnly: true,
      maxAge: 3 * 60 * 60,
      sameSite: "lax",
      secure: isProduction(),
    });
  } catch {
    return { errors: { server: ["Login service unavailable."] } };
  }

  redirect("/");
}

"use server";

import { FormState } from "@/lib/definitions";
import { login } from "./login";

export async function register(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const deviceId = formData.get("deviceId") as string;

  if (!username || !password) {
    return {
      errors: {
        username: !username ? ["Username is required"] : [],
        password: !password ? ["Password is required"] : [],
      },
      inputs: { username },
    };
  }

  let registrationSuccessful = false;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "POST",
      body: JSON.stringify({ username, password, email }),
      headers: {
        "X-Device-Id": deviceId,
        "X-App-Id": process.env.NEXT_PUBLIC_APP_ID || "",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status !== 201) {
      const data = await response.json();
      return {
        errors: {
          server: Array.isArray(data.message) ? data.message : [data.message],
        },
        inputs: { username },
      };
    }

    registrationSuccessful = true;
  } catch {
    return {
      errors: { server: ["Unable to connect to service."] },
      inputs: { username },
    };
  }

  if (registrationSuccessful) {
    return await login(null, formData);
  }

  return { errors: { server: ["An unknown error occurred."] } };
}

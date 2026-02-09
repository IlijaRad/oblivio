"use server";

import { FormState } from "@/lib/definitions";
import { login } from "./login";

export async function register(
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = (formData.get("username") as string)?.trim() ?? "";
  const emailRaw = (formData.get("email") as string)?.trim() ?? "";
  const password = (formData.get("password") as string)?.trim() ?? "";
  const deviceId = formData.get("deviceId") as string;

  if (!username || !password) {
    return {
      errors: {
        username: !username ? ["Username is required"] : [],
        password: !password ? ["Password is required"] : [],
        email: [],
      },
      inputs: { username, email: emailRaw },
    };
  }

  const payload: Record<string, string> = {
    username,
    password,
  };

  if (emailRaw) {
    payload.email = emailRaw;
  }

  let registrationSuccessful = false;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "X-Device-Id": deviceId,
        "X-App-Id": process.env.NEXT_PUBLIC_APP_ID || "",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        errors: {
          server: Array.isArray(data.message)
            ? data.message
            : [data.message || `Registration failed (${response.status})`],
        },
        inputs: { username, email: emailRaw },
      };
    }

    registrationSuccessful = true;
  } catch {
    return {
      errors: { server: ["Unable to connect to service."] },
      inputs: { username, email: emailRaw },
    };
  }

  if (registrationSuccessful) {
    return await login(null, formData);
  }

  return {
    errors: { server: ["An unknown error occurred."] },
    inputs: { username, email: emailRaw },
  };
}

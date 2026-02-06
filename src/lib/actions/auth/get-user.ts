"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";
import { logout } from "./logout";

type Payload =
  | {
      id: string;
      username: string;
      email: string;
      role: string;
      isSearchable: boolean;
      avatarKey: string;
      e2eEnabled: boolean;
      e2eReady: boolean;
      e2eUpdatedAt: string;
    }
  | {
      errors: {
        username: string;
      };
    };

export async function getUser() {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/`,
      {
        next: {
          tags: ["profile"],
        },
        method: "GET",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (response.status === 401) {
      await logout();
      return;
    }

    if (response.status !== 200) {
      const { message } = (await response.json()) as { message: string };
      return { errors: { user: [message] } };
    }

    const payload = (await response.json()) as Payload;

    return payload;
  } catch {
    return {
      errors: {
        user: ["An error has occured, please try again."],
      },
    };
  }
}

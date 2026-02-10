"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export type FriendsResponse = {
  id: string;
  username: string;
  email: string | null;
  since: string;
}[];

export async function getFriends() {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/friends`, {
      method: "GET",
      headers: {
        ...headers,
        Authorization: `Bearer ${bearer}`,
      },
      next: { tags: ["friends"] },
    });

    if (response.status !== 200) {
      return [];
    }

    const payload = (await response.json()) as FriendsResponse;

    return payload;
  } catch {
    return [];
  }
}

"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export type Friends = {
  id: string;
  username: string;
  email: string | null;
  since: string;
}[];

export async function searchFriends(q: string) {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/friends/search`);

  if (q.trim() !== "") {
    url.searchParams.set("q", q);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      ...headers,
      Authorization: `Bearer ${bearer}`,
    },
  });

  if (response.status !== 200) {
    return [];
  }

  const payload = (await response.json()) as Friends;

  return payload;
}

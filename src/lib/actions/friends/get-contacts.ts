"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

export type Contact = {
  id: string;
  username: string;
  email: string | null;
  avatarKey: string | null;
  lastMessage: string | null;
};

export async function getContacts(): Promise<Contact[]> {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/contacts`,
      {
        method: "GET",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
        next: { tags: ["contacts"] },
      },
    );

    if (response.status !== 200) return [];

    return (await response.json()) as Contact[];
  } catch {
    return [];
  }
}

"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

type Payload = {
  token: string;
} | null;

export async function generateInviteLink() {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/friends/invite-token`,
    {
      method: "POST",
      headers: {
        ...headers,
        Authorization: `Bearer ${bearer}`,
      },
    },
  );

  let payload: Payload = null;

  if (response.status !== 201) {
    const { message } = (await response.json()) as { message: string };
    return { errors: { error: [message] } };
  }

  payload = (await response.json()) as Payload;

  return payload;
}

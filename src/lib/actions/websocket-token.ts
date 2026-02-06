"use server";

import { cookies } from "next/headers";
import { AUTHENTICATION_COOKIE_NAME } from "../definitions";
import { getDefaultHeaders } from "./headers";

export const getWebsocketToken = async () => {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ws/token`, {
    method: "GET",
    headers: {
      ...headers,
      Authorization: `Bearer ${bearer}`,
    },
  });

  const json = await response.json();
  return json.token;
};

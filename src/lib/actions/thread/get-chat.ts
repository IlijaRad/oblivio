"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { getDefaultHeaders } from "../headers";

type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
  readAt: number | null;
  attachment: null;
};

type ChatResponse =
  | {
      items: Message[];
      nextCursor: string | null;
    }
  | {
      errors: {
        user?: string[];
      };
    };

export async function getChat(id: string): Promise<ChatResponse> {
  const headers = await getDefaultHeaders();
  const cookieStore = await cookies();
  const bearer = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value ?? "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/thread?with=${id}&limit=50`,
      {
        method: "GET",
        headers: {
          ...headers,
          Authorization: `Bearer ${bearer}`,
        },
      },
    );

    if (!response.ok) {
      try {
        const { message } = (await response.json()) as { message: string };
        return { errors: { user: [message || "Request failed"] } };
      } catch {
        return { errors: { user: [`HTTP ${response.status}`] } };
      }
    }

    const payload = (await response.json()) as {
      items: Message[];
      nextCursor: string | null;
    };

    return payload;
  } catch (err) {
    console.error("getChat fetch error:", err);
    return {
      errors: {
        user: ["An error occurred, please try again."],
      },
    };
  }
}

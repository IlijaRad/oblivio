"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";

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
    }
  | {
      unauthorized: true;
    };

export async function getChat(id: string): Promise<ChatResponse> {
  try {
    const response = await apiClient(`/messages/thread?with=${id}&limit=50`, {
      method: "GET",
    });

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
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }

    console.error("getChat fetch error:", error);
    return {
      errors: {
        user: ["An error occurred, please try again."],
      },
    };
  }
}

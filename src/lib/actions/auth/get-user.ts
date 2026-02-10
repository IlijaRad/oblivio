"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";
import { User } from "@/lib/definitions";

type Payload =
  | User
  | {
      errors: {
        user: string[];
      };
    }
  | {
      unauthorized: boolean;
    };

export async function getUser() {
  try {
    const response = await apiClient("/users/me/", {
      next: { tags: ["profile"] },
    });

    if (!response.ok) {
      const { message } = await response.json();
      return { errors: { user: [message as string] } };
    }

    const data = (await response.json()) as Payload;

    return data;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }
    return { errors: { user: ["An error occurred, please try again."] } };
  }
}

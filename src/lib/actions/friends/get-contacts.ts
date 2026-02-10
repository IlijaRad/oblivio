"use server";

import { apiClient, UnauthorizedError } from "@/lib/api-client";

export type Contact = {
  id: string;
  username: string;
  email: string;
  avatarKey: string | null;
};

export type ContactsResponse =
  | Contact[]
  | {
      errors: {
        user?: string[];
      };
    }
  | {
      unauthorized: true;
    };

export async function getContacts(): Promise<ContactsResponse> {
  try {
    const response = await apiClient("/users/me/contacts", {
      next: { tags: ["contacts"] },
    });

    if (!response.ok) {
      try {
        const { message } = (await response.json()) as { message: string };
        return { errors: { user: [message || "Request failed"] } };
      } catch {
        return { errors: { user: [`HTTP ${response.status}`] } };
      }
    }

    const contacts = (await response.json()) as Contact[];

    return contacts;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }

    return {
      errors: {
        user: ["An error occurred, please try again."],
      },
    };
  }
}

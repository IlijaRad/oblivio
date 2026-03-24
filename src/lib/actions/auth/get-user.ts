"use server";

import {
  apiClient,
  LicenseRequiredError,
  UnauthorizedError,
} from "@/lib/api-client";
import { GetUserResult } from "@/lib/definitions";

export async function getUser(): Promise<GetUserResult> {
  try {
    const response = await apiClient("/users/me", {
      next: { tags: ["profile"] },
    });
    if (!response.ok) {
      const { message } = await response.json();
      return { errors: { user: [message as string] } };
    }
    return await response.json();
  } catch (error) {
    if (error instanceof LicenseRequiredError) {
      return { licenseRequired: true };
    }
    if (error instanceof UnauthorizedError) {
      return { unauthorized: true };
    }
    return { errors: { user: ["An error occurred, please try again."] } };
  }
}

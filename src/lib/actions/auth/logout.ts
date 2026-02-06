"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  const hasCookie = cookieStore.has(AUTHENTICATION_COOKIE_NAME);

  if (hasCookie) {
    cookieStore.delete(AUTHENTICATION_COOKIE_NAME);
  }

  redirect("/login");
}

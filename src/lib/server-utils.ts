"use server";

import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function redirectToLogin() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTHENTICATION_COOKIE_NAME);
  redirect("/login");
}

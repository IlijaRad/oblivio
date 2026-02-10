"use server";
import { cookies } from "next/headers";

export async function getOrCreateDeviceId() {
  const KEY = "device_id";
  const cookieStore = await cookies();
  const id = cookieStore.get(KEY)?.value;

  return id || "unknown";
}

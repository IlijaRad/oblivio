"use server";

import { getOrCreateDeviceId } from "@/lib/device";

export async function getDefaultHeaders() {
  return {
    "X-Device-Id": await getOrCreateDeviceId(),
    "X-App-Id": process.env.NEXT_PUBLIC_APP_ID || "",
    "Content-Type": "application/json",
  };
}

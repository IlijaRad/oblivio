"use server";
import { getOrCreateDeviceId } from "@/lib/device";

export async function getDefaultHeaders() {
  const deviceId = await getOrCreateDeviceId();

  return {
    "X-Device-Id": deviceId,
    "X-App-Id": process.env.NEXT_PUBLIC_APP_ID || "",
    "Content-Type": "application/json",
  };
}

"use server";

import { cookies } from "next/headers";

export async function getOrCreateDeviceId() {
  const KEY = "device_id";
  const cookieStore = await cookies();
  let id = cookieStore.get(KEY)?.value || "";
  if (!id) {
    id = "dev_" + cryptoRandom();
    cookieStore.set(KEY, id);
  }
  return id;
}

function cryptoRandom() {
  try {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return (
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    );
  }
}

"use client";

import { WebSocketProvider } from "@/context/WebSocketProvider";
import { ReactNode } from "react";

export function ClientLayout({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  return <WebSocketProvider userId={userId}>{children}</WebSocketProvider>;
}

"use client";

import { WebSocketProvider } from "@/context/WebSocketProvider";
import { CallOverlay } from "@/ui/components/call-overlay";
import { CallProvider } from "@/ui/components/call-provider";

export function ClientLayout({
  userId,
  token,
  children,
  contacts,
}: {
  userId: string;
  token?: string;
  children: React.ReactNode;
  contacts?: { id: string; username: string }[];
}) {
  const getCallerName = (userId: string) =>
    contacts?.find((c) => c.id === userId)?.username ?? userId;

  return (
    <WebSocketProvider userId={userId}>
      <CallProvider token={token}>
        {children}
        <CallOverlay getCallerName={getCallerName} />
      </CallProvider>
    </WebSocketProvider>
  );
}

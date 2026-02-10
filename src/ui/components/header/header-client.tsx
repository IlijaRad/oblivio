"use client";

import { useWebSocket } from "@/context/WebSocketProvider";
import { User } from "@/lib/definitions";
import { isFriendEvent } from "@/lib/websocket";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "./header";

export function HeaderClient({
  user,
  initialRequestCount,
}: {
  user: User;
  initialRequestCount: number;
}) {
  const [requestCount, setRequestCount] = useState(initialRequestCount);
  const { addListener } = useWebSocket();
  const router = useRouter();

  const handleCountChange = (delta: number) => {
    setRequestCount((prev) => Math.max(0, prev + delta));
  };

  useEffect(() => {
    const remove = addListener((payload) => {
      // Handle friend-related events
      if (isFriendEvent(payload)) {
        if (payload.event === "request") {
          // Increment the badge count
          setRequestCount((prev) => prev + 1);
        } else if (payload.event === "accepted") {
          // Decrement count when accepted via WebSocket
          setRequestCount((prev) => Math.max(0, prev - 1));
          // Refresh to update contacts list
          router.refresh();
        } else if (payload.event === "unfriended") {
          // Refresh to update contacts list
          router.refresh();
        }
      }
    });

    return remove;
  }, [addListener, router]);

  return (
    <Header
      requestCount={requestCount}
      user={user}
      onCountChange={handleCountChange}
    />
  );
}

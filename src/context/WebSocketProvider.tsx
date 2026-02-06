"use client";

import { getWebsocketToken } from "@/lib/actions/websocket-token";
import { Message } from "@/lib/definitions";
import { connectWebSocket, subscribeUserChannel } from "@/lib/websocket";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

export type MessageHandler = (
  message: Message & { with: number; type: string; upTo: number },
) => void;

type WebSocketContextValue = {
  addListener: (handler: MessageHandler) => () => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const handlers = useRef<Set<MessageHandler>>(new Set());

  useEffect(() => {
    async function init() {
      const token = await getWebsocketToken();
      connectWebSocket(token);

      subscribeUserChannel(userId, (payload) => {
        handlers.current.forEach((h) => h(payload));
      });
    }

    init();
  }, [userId]);

  const addListener = (handler: MessageHandler) => {
    handlers.current.add(handler);

    return () => {
      handlers.current.delete(handler);
    };
  };

  return (
    <WebSocketContext.Provider value={{ addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  }
  return ctx;
}

"use client";

import { getWebsocketToken } from "@/lib/actions/websocket-token";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeUserChannel,
  WebSocketPayload,
} from "@/lib/websocket";
import { createContext, ReactNode, useContext, useEffect, useRef } from "react";

export type MessageHandler = (message: WebSocketPayload) => void;

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
    let mounted = true;

    async function init() {
      try {
        const token = await getWebsocketToken();
        if (!mounted) return;

        connectWebSocket(token);
        subscribeUserChannel(userId, (payload) => {
          handlers.current.forEach((h) => {
            h(payload);
          });
        });
      } catch {}
    }

    init();

    return () => {
      mounted = false;
      disconnectWebSocket();
    };
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

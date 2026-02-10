import { Centrifuge, Subscription } from "centrifuge";
import { Message } from "./definitions";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

let centrifuge: Centrifuge | null = null;
let subscription: Subscription | null = null;

export type SeenEvent = {
  type: "seen";
  with: string;
  upTo: number;
};

export type FriendEvent = {
  type: "friend";
  event:
    | "accepted"
    | "unfriended"
    | "request"
    | "request_sent"
    | "declined"
    | "rejected";
  userId?: string;
  requestId?: string;
};

export type MessageEvent = Message & {
  type?: "message";
};

export type WebSocketPayload = MessageEvent | SeenEvent | FriendEvent;

export function isSeenEvent(payload: WebSocketPayload): payload is SeenEvent {
  return payload.type === "seen";
}

export function isFriendEvent(
  payload: WebSocketPayload,
): payload is FriendEvent {
  return payload.type === "friend";
}

export function isMessageEvent(
  payload: WebSocketPayload,
): payload is MessageEvent {
  return "id" in payload && "fromUserId" in payload && "toUserId" in payload;
}

export function connectWebSocket(token: string) {
  if (!WEBSOCKET_URL) {
    throw new Error("WEBSOCKET_URL is not defined");
  }
  if (centrifuge) return centrifuge;

  centrifuge = new Centrifuge(WEBSOCKET_URL, {
    token,
    debug: true,
  });

  centrifuge.on("connected", (ctx) => {
    console.log("WebSocket connected", ctx);
  });

  centrifuge.on("disconnected", (ctx) => {
    console.log("WebSocket disconnected", ctx);
  });

  centrifuge.connect();
  return centrifuge;
}

export function subscribeUserChannel(
  userId: string,
  onMessage: (data: WebSocketPayload) => void,
) {
  if (!centrifuge) {
    return;
  }

  if (subscription) {
    return;
  }

  const channel = `conversation.${userId}`;

  subscription = centrifuge.newSubscription(channel);

  subscription.on("publication", (ctx) => {
    const payload = ctx.data as WebSocketPayload;
    onMessage(payload);
  });

  subscription.subscribe();
}

export function disconnectWebSocket() {
  subscription?.unsubscribe();
  subscription = null;
  centrifuge?.disconnect();
  centrifuge = null;
}

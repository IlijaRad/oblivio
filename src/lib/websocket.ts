import { Centrifuge, Subscription } from "centrifuge";
import { calls, RawIceCandidate, RawIceItem } from "./calls";
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

export type CallEvent =
  | {
      type: "call-offer";
      callId: string;
      fromUserId: string;
      sdp: { type: string; sdp: string };
      hasVideo: boolean;
    }
  | {
      type: "call-answer";
      callId: string;
      fromUserId: string;
      sdp: { type: string; sdp: string };
    }
  | {
      type: "call-ice";
      callId: string;
      fromUserId: string;
      candidate: RawIceCandidate;
    }
  | {
      type: "ice-candidate";
      callId: string;
      fromUserId: string;
      candidate: RawIceCandidate;
    }
  | {
      type: "call-ice-batch";
      callId: string;
      fromUserId: string;
      items: Array<RawIceItem>;
    }
  | { type: "call-end" | "call-cancel"; callId: string; fromUserId?: string };

export type MessageEvent = Message & {
  type?: "message";
};

export type WebSocketPayload =
  | MessageEvent
  | SeenEvent
  | FriendEvent
  | CallEvent;

export function isCallEvent(payload: WebSocketPayload): payload is CallEvent {
  const callTypes = [
    "call-offer",
    "call-answer",
    "call-ice",
    "ice-candidate",
    "call-ice-batch",
    "call-end",
    "call-cancel",
  ];
  return "type" in payload && callTypes.includes(payload.type as string);
}

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

  centrifuge.connect();
  return centrifuge;
}

export function subscribeUserChannel(
  userId: string,
  onMessage: (data: WebSocketPayload) => void,
) {
  if (!centrifuge || subscription) return;

  const channel = `conversation.${userId}`;
  const callsChannel = `calls.${userId}`;

  const callsSub = centrifuge.newSubscription(callsChannel);
  subscription = centrifuge.newSubscription(channel);

  subscription.on("publication", (ctx) => {
    const payload = ctx.data as WebSocketPayload;
    onMessage(payload);
  });

  callsSub.on("publication", (ctx) => {
    const payload = ctx.data as WebSocketPayload;
    if ("fromUserId" in payload && payload.fromUserId === userId) return;
    if (isCallEvent(payload)) {
      calls.handleIncoming(payload);
    }
    onMessage(payload);
  });
  callsSub.subscribe();
  subscription.subscribe();
}

export function disconnectWebSocket() {
  subscription?.unsubscribe();
  subscription = null;
  centrifuge?.disconnect();
  centrifuge = null;
}

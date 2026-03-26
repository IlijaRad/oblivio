import { Centrifuge, Subscription } from "centrifuge";
import { calls, RawIceCandidate, RawIceItem } from "./calls";
import { Group, Message } from "./definitions";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

let centrifuge: Centrifuge | null = null;
let subscription: Subscription | null = null;

export type SeenEvent = {
  type: "seen";
  with: string;
  upTo: number;
};

export type MessageEvent = Message & {
  type?: "message";
};

export type MessageUpdatedEvent = {
  type: "message-updated";
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
  editedAt: number;
  reactions: Record<string, string[]>;
  attachment: null;
};

export type MessageDeletedEvent = {
  type: "message-deleted";
  id: string;
  deletedBy: string;
};

export type MessageReactionEvent = {
  type: "message-reaction";
  id: string;
  userId: string;
  emoji: string;
  reacted: boolean;
  reactions: Record<string, string[]>;
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

export type GroupMessageEvent = {
  type: "group-message";
  id: string;
  groupId: string;
  fromUserId: string;
  body: string;
  createdAt: number;
  editedAt: null;
  reactions: Record<string, { userId: string }[]>;
  attachment: null;
};

export type GroupCreatedEvent = {
  type: "group-created";
  group: Group;
};

export type GroupUpdatedEvent = {
  type: "group-updated";
  group: {
    id: string;
    name: string;
    avatarKey: string | null;
    updatedAt: number;
  };
  updatedBy: string;
};

export type GroupDeletedEvent = {
  type: "group-deleted";
  groupId: string;
  deletedBy: string;
};

export type GroupMembersAddedEvent = {
  type: "group-members-added";
  groupId: string;
  memberIds: string[];
  addedBy: string;
};

export type GroupMemberRemovedEvent = {
  type: "group-member-removed";
  groupId: string;
  memberId: string;
  removedBy: string;
};

export type GroupMessageUpdatedEvent = {
  type: "group-message-updated";
  id: string;
  groupId: string;
  fromUserId: string;
  body: string;
  editedAt: number;
  reactions: Record<string, { userId: string }[]>;
  attachment: null;
};

export type GroupMessageDeletedEvent = {
  type: "group-message-deleted";
  id: string;
  groupId: string;
  deletedBy: string;
};

export type GroupMessageReactionEvent = {
  type: "group-message-reaction";
  id: string;
  groupId: string;
  userId: string;
  emoji: string;
  reacted: boolean;
  reactions: Record<string, { userId: string }[]>;
};

export type WebSocketPayload =
  | MessageEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | MessageReactionEvent
  | SeenEvent
  | FriendEvent
  | CallEvent
  | GroupCreatedEvent
  | GroupUpdatedEvent
  | GroupDeletedEvent
  | GroupMembersAddedEvent
  | GroupMemberRemovedEvent
  | GroupMessageEvent
  | GroupMessageUpdatedEvent
  | GroupMessageDeletedEvent
  | GroupMessageReactionEvent;

export function isSeenEvent(payload: WebSocketPayload): payload is SeenEvent {
  return payload.type === "seen";
}

export function isMessageEvent(
  payload: WebSocketPayload,
): payload is MessageEvent {
  return (
    "id" in payload &&
    "fromUserId" in payload &&
    "toUserId" in payload &&
    payload.type !== "message-updated"
  );
}

export function isMessageUpdatedEvent(
  payload: WebSocketPayload,
): payload is MessageUpdatedEvent {
  return payload.type === "message-updated";
}

export function isMessageDeletedEvent(
  payload: WebSocketPayload,
): payload is MessageDeletedEvent {
  return payload.type === "message-deleted";
}

export function isMessageReactionEvent(
  payload: WebSocketPayload,
): payload is MessageReactionEvent {
  return payload.type === "message-reaction";
}

export function isFriendEvent(
  payload: WebSocketPayload,
): payload is FriendEvent {
  return payload.type === "friend";
}

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

export function isGroupMessageEvent(
  payload: WebSocketPayload,
): payload is GroupMessageEvent {
  return payload.type === "group-message";
}

export function isGroupCreatedEvent(
  payload: WebSocketPayload,
): payload is GroupCreatedEvent {
  return payload.type === "group-created";
}

export function isGroupUpdatedEvent(
  payload: WebSocketPayload,
): payload is GroupUpdatedEvent {
  return payload.type === "group-updated";
}

export function isGroupDeletedEvent(
  payload: WebSocketPayload,
): payload is GroupDeletedEvent {
  return payload.type === "group-deleted";
}

export function isGroupMembersAddedEvent(
  payload: WebSocketPayload,
): payload is GroupMembersAddedEvent {
  return payload.type === "group-members-added";
}

export function isGroupMemberRemovedEvent(
  payload: WebSocketPayload,
): payload is GroupMemberRemovedEvent {
  return payload.type === "group-member-removed";
}

export function isGroupMessageUpdatedEvent(
  payload: WebSocketPayload,
): payload is GroupMessageUpdatedEvent {
  return payload.type === "group-message-updated";
}

export function isGroupMessageDeletedEvent(
  payload: WebSocketPayload,
): payload is GroupMessageDeletedEvent {
  return payload.type === "group-message-deleted";
}

export function isGroupMessageReactionEvent(
  payload: WebSocketPayload,
): payload is GroupMessageReactionEvent {
  return payload.type === "group-message-reaction";
}

let isFirstConnect = true;

export function connectWebSocket(token: string) {
  if (!WEBSOCKET_URL) throw new Error("WEBSOCKET_URL is not defined");
  if (centrifuge) return centrifuge;
  centrifuge = new Centrifuge(WEBSOCKET_URL, {
    token,
    minReconnectDelay: 1000,
    maxReconnectDelay: 20000,
    maxServerPingDelay: 10000,
  });

  centrifuge.on("connected", () => {
    if (!isFirstConnect) {
      window.dispatchEvent(new Event("ws:reconnected"));
    }
    isFirstConnect = false;
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
    onMessage(ctx.data as WebSocketPayload);
  });

  callsSub.on("publication", (ctx) => {
    const payload = ctx.data as WebSocketPayload;
    if ("fromUserId" in payload && payload.fromUserId === userId) return;
    if (isCallEvent(payload)) calls.handleIncoming(payload);
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

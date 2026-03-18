export const AUTHENTICATION_COOKIE_NAME = "session";

export type FormState = {
  errors?: {
    username?: string[];
    email?: string[];
    password?: string[];
    server?: string[];
  };
  inputs?: {
    username?: string;
    email?: string;
  };
} | null;

export interface Requester {
  id: string;
  username: string;
  avatarKey: string | null;
  e2eEnabled: boolean;
  role: {
    id: string;
    name: string;
  };
}

export interface FriendRequest {
  id: string;
  requesterId: string;
  responderId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
  requester: Requester;
}

export function isImageAttachment(attachment: Message["attachment"]) {
  return (
    !!attachment &&
    attachment.type === "image" &&
    typeof attachment.key === "string"
  );
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: number;
  readAt: number | string | null;
  attachment: { key: string; type: string; name: string; size: number };
  type?: string;
  with?: string;
  upTo?: number;
}

export interface ChatResponse {
  items: Message[];
  nextCursor: string | null;
}

export type GetChatResult = ChatResponse | { errors: { server: string[] } };

export type SidebarContact = {
  id: string;
  username: string;
  avatarKey?: string | null;
  email?: string | null;
  since?: string;
  unreadCount?: number;
};

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  isSearchable: boolean;
  avatarKey: string | null;
  e2eEnabled?: boolean;
  e2eReady?: boolean;
  e2eUpdatedAt?: string;
}

export interface SelectedContact {
  id: string;
  username: string;
  avatarKey: string | null;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatarKey?: string | null;
  isAdmin?: boolean;
  joinedAt?: number;
}

export interface Group {
  id: string;
  name: string | null;
  avatarKey: string | null;
  createdAt: number;
  membersCount?: number;
  members?: GroupMember[];
  unreadCount?: number;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupMessageAttachment {
  key: string;
  type: "image" | "video" | "audio" | "file";
  name?: string;
  size?: number;
  duration?: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  fromUserId: string;
  body: string;
  createdAt: string;
  attachment?: GroupMessageAttachment | null;
  reactions?: { emoji: string; userId: string }[];
}

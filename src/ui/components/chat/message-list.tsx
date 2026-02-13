"use client";

import {
  isImageAttachment,
  Message,
  SelectedContact,
  User,
} from "@/lib/definitions";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import IconCamera from "../../icons/icon-camera";
import IconPhone from "../../icons/icon-phone";
import AudioPlayer from "../audio-player";

type ChatStyles = {
  sent: string;
  sentText: string;
  received: string;
  receivedText: string;
  headerText: string;
};

export interface MissedCallMessage {
  id: string;
  type: "missed-call";
  hasVideo: boolean;
  fromUserId: string;
  createdAt: string;
}

export type ChatItem = Message | MissedCallMessage;

export function isMissedCallMessage(item: ChatItem): item is MissedCallMessage {
  return (item as MissedCallMessage).type === "missed-call";
}

interface MessageListProps {
  messages: ChatItem[];
  contact: SelectedContact;
  currentUser: User;
  contactAvatar: string | null;
  myAvatarUrl: string | null;
  apiBase?: string;
  styles: ChatStyles;
}

export function MessageList({
  messages,
  contact,
  currentUser,
  contactAvatar,
  myAvatarUrl,
  apiBase,
  styles,
}: MessageListProps) {
  return (
    <div className="space-y-5">
      {messages.map((msg) => {
        if (isMissedCallMessage(msg)) {
          return (
            <MissedCallBubble
              key={msg.id}
              msg={msg}
              isMeCaller={msg.fromUserId === currentUser.id}
            />
          );
        }

        const isMe = msg.fromUserId === currentUser.id;

        return (
          <div
            key={msg.id}
            className={`flex gap-3 items-start ${isMe ? "justify-end" : ""}`}
          >
            {!isMe && (
              <Avatar src={contactAvatar} fallback={contact.username[0]} />
            )}

            <div className="max-w-[78%] md:max-w-[65%]">
              <div
                className={`rounded-2xl px-4 py-3 ${
                  isMe
                    ? `${styles.sent} ${styles.sentText}`
                    : `${styles.received} ${styles.receivedText}`
                }`}
              >
                <MessageContent
                  message={msg}
                  apiBase={apiBase}
                  className={isMe ? styles.sentText : styles.receivedText}
                />
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="text-[10px] opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isMe && (
                    <span className="text-[10px] opacity-70">
                      {msg.readAt ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isMe && (
              <Avatar src={myAvatarUrl} fallback={currentUser.username[0]} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ src, fallback }: { src: string | null; fallback: string }) {
  return (
    <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
      {src ? (
        <Image
          src={src}
          fill
          alt="avatar"
          className="object-cover select-none"
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
          unoptimized
        />
      ) : (
        <span
          className="font-bold select-none text-zinc-900 dark:text-white uppercase"
          style={{
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          }}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}

function MissedCallBubble({
  msg,
  isMeCaller,
}: {
  msg: MissedCallMessage;
  isMeCaller: boolean;
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const icon = msg.hasVideo ? (
    <IconCamera className="text-red-600 dark:text-red-400" />
  ) : (
    <IconPhone className="text-red-600 dark:text-red-400" />
  );

  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400">
        {icon}
        <span>
          {isMeCaller
            ? `Missed ${msg.hasVideo ? "video " : ""}call`
            : `Incoming ${msg.hasVideo ? "video " : ""}call`}
        </span>
        <span className="opacity-60">{time}</span>
      </div>
    </div>
  );
}

function MessageContent({
  message,
  apiBase,
  className,
}: {
  message: Message;
  apiBase?: string;
  className: string;
}) {
  const viewUrl = `${apiBase}/uploads/view?key=${encodeURIComponent(
    message.attachment?.key || "",
  )}`;

  const size = message.attachment?.size || 0;

  function formatFileSize(bytes: number) {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }

  if (isImageAttachment(message.attachment)) {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl max-w-65">
          <Image
            src={viewUrl}
            alt="Image attachment"
            width={260}
            height={260}
            className="object-cover"
            unoptimized
            onLoadingComplete={() => window.dispatchEvent(new Event("resize"))}
          />
        </div>
        {message.body && (
          <p className="text-[15px] leading-relaxed break-all">
            {message.body}
          </p>
        )}
      </div>
    );
  }

  if (message.attachment?.type === "video") {
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl max-w-65">
          <video
            src={viewUrl}
            controls
            width={260}
            height={260}
            className="object-cover rounded-lg"
          />
        </div>
        {message.body && (
          <p className="text-[15px] leading-relaxed break-all">
            {message.body}
          </p>
        )}
      </div>
    );
  }

  if (message.attachment?.type === "audio") {
    return (
      <div className={twMerge("my-2", className)}>
        <AudioPlayer src={viewUrl} className={className} />
        {message.body && (
          <p className="mt-2 text-[15px] leading-relaxed break-all">
            {message.body}
          </p>
        )}
      </div>
    );
  }

  if (message.attachment?.type === "file") {
    return (
      <div className={twMerge("my-2 flex gap-x-2 items-center", className)}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          className="dark:opacity-50"
        >
          <path
            d="M9.5999 3.19995C7.8349 3.19995 6.3999 4.63495 6.3999 6.39995V25.6C6.3999 27.365 7.8349 28.8 9.5999 28.8H22.3999C24.1649 28.8 25.5999 27.365 25.5999 25.6V11.725C25.5999 10.875 25.2649 10.06 24.6649 9.45995L19.3349 4.13495C18.7349 3.53495 17.9249 3.19995 17.0749 3.19995H9.5999ZM22.6749 12H17.9999C17.3349 12 16.7999 11.465 16.7999 10.8V6.12495L22.6749 12Z"
            fill="currentColor"
          />
        </svg>
        <div className="flex flex-col gap-y-0">
          <div className="break-all leading-none text-[15px]">
            {message.attachment.name || "file"}
          </div>
          <div className="text-xs leading-none mt-1">
            {formatFileSize(size)}
          </div>
        </div>
        <a href={viewUrl} target="_blank" rel="noreferrer">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            className="dark:opacity-50"
          >
            <path
              d="M17.5998 4.79995C17.5998 3.91495 16.8848 3.19995 15.9998 3.19995C15.1148 3.19995 14.3998 3.91495 14.3998 4.79995V15.335L12.3298 13.265C11.7048 12.64 10.6898 12.64 10.0648 13.265C9.43981 13.89 9.43981 14.905 10.0648 15.53L14.8648 20.33C15.4898 20.955 16.5048 20.955 17.1298 20.33L21.9298 15.53C22.5548 14.905 22.5548 13.89 21.9298 13.265C21.3048 12.64 20.2898 12.64 19.6648 13.265L17.5998 15.335V4.79995ZM7.9998 19.2C6.2348 19.2 4.7998 20.635 4.7998 22.4V24C4.7998 25.765 6.2348 27.2 7.9998 27.2H23.9998C25.7648 27.2 27.1998 25.765 27.1998 24V22.4C27.1998 20.635 25.7648 19.2 23.9998 19.2H21.6548L18.8248 22.03C17.2648 23.59 14.7298 23.59 13.1698 22.03L10.3448 19.2H7.9998ZM23.1998 22C23.8648 22 24.3998 22.535 24.3998 23.2C24.3998 23.865 23.8648 24.4 23.1998 24.4C22.5348 24.4 21.9998 23.865 21.9998 23.2C21.9998 22.535 22.5348 22 23.1998 22Z"
              fill="currentColor"
            />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <p className="text-[15px] leading-relaxed break-all">{message.body}</p>
  );
}

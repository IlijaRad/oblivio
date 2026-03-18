"use client";

import { GroupDetail, GroupMessage, User } from "@/lib/definitions";
import Image from "next/image";
import AudioPlayer from "../audio-player";

interface GroupMessageListProps {
  messages: GroupMessage[];
  group: GroupDetail;
  currentUser: User;
  apiBase?: string;
  styles: {
    sent: string;
    sentText: string;
    received: string;
    receivedText: string;
    time: string;
  };
}

export function GroupMessageList({
  messages,
  group,
  currentUser,
  apiBase,
  styles,
}: GroupMessageListProps) {
  const memberMap = new Map(group.members.map((m) => [m.userId, m]));
  const visibleMessages = messages.filter(
    (msg) => msg.fromUserId === currentUser.id || memberMap.has(msg.fromUserId),
  );

  // My avatar (for sent messages – now shown like 1:1 chat)
  const myAvatarUrl = currentUser.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(currentUser.avatarKey)}`
    : null;

  return (
    <div className="space-y-5">
      {" "}
      {/* ← same as MessageList */}
      {visibleMessages.map((msg, index) => {
        const isMine = msg.fromUserId === currentUser.id;
        const sender = memberMap.get(msg.fromUserId);
        const senderAvatarUrl = sender?.avatarKey
          ? `${apiBase}/uploads/view?key=${encodeURIComponent(sender.avatarKey)}`
          : null;
        const senderName = sender?.username ?? "Unknown";

        return (
          <div
            key={msg.id ?? index}
            className={`flex gap-3 items-center ${isMine ? "justify-end" : ""}`}
          >
            {/* Received avatar (left) */}
            {!isMine && (
              <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                {senderAvatarUrl ? (
                  <Image
                    src={senderAvatarUrl}
                    alt={senderName}
                    fill
                    className="object-cover select-none"
                    style={{
                      WebkitUserSelect: "none",
                      userSelect: "none",
                      WebkitTouchCallout: "none",
                    }}
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
                    {senderName[0]}
                  </span>
                )}
              </div>
            )}

            <div className="max-w-[78%] md:max-w-[65%]">
              {!isMine && (
                <span className="text-xs text-gray-400 mb-1 ml-1">
                  {senderName}
                </span>
              )}
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  isMine
                    ? `${styles.sent} ${styles.sentText}`
                    : `${styles.received} ${styles.receivedText}`
                }`}
              >
                {msg.attachment ? (
                  <AttachmentPreview
                    attachment={msg.attachment}
                    apiBase={apiBase}
                  />
                ) : (
                  msg.body
                )}

                {/* Time + read status inside bubble (bottom right) */}
                <div className="flex items-center justify-end gap-1.5 mt-1">
                  <span className="text-[10px] opacity-70">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Sent avatar (right – now shown like 1:1 chat) */}
            {isMine && (
              <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                {myAvatarUrl ? (
                  <Image
                    src={myAvatarUrl}
                    alt="You"
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    {currentUser.username[0]}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AttachmentPreview({
  attachment,
  apiBase,
}: {
  attachment: GroupMessage["attachment"];
  apiBase?: string;
}) {
  if (!attachment) return null;
  const url = `${apiBase}/uploads/view?key=${encodeURIComponent(attachment.key)}`;
  if (attachment.type === "image") {
    return (
      <Image
        src={url}
        alt={attachment.name ?? "image"}
        width={240}
        height={180}
        className="rounded-lg object-cover max-w-60"
      />
    );
  }
  if (attachment.type === "audio") {
    return (
      <div className="my-2">
        <AudioPlayer src={url} />
      </div>
    );
  }
  if (attachment.type === "video") {
    return <video controls src={url} className="rounded-lg max-w-60" />;
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-sm"
    >
      {attachment.name ?? "Download file"}
    </a>
  );
}

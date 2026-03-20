"use client";

import {
  addMessageReaction,
  deleteMessage,
  editMessage,
} from "@/lib/actions/thread/message-actions";
import {
  isImageAttachment,
  Message,
  SelectedContact,
  User,
} from "@/lib/definitions";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Popover from "@radix-ui/react-popover";
import { IconMoodSmile, IconPencil, IconTrash } from "@tabler/icons-react";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import React, {
  Dispatch,
  forwardRef,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import IconCamera from "../../icons/icon-camera";
import IconPhone from "../../icons/icon-phone";
import AudioPlayer from "../audio-player";
import linkify from "./linkify";

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
  onMessagesChange?: Dispatch<SetStateAction<ChatItem[]>>;
  pendingReactionIds?: React.MutableRefObject<Set<string>>;
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={twMerge(
        "animate-pulse rounded-lg bg-black/10 dark:bg-white/10",
        className,
      )}
    />
  );
}

function useIsFirefox() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent),
    [],
  );
}

const EmojiTriggerButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label="React to message"
    {...props}
    className="size-7 pointer-events-auto flex items-center justify-center rounded-full border shadow-sm transition-all duration-150 opacity-0 group-hover/msgrow:opacity-100 [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:opacity-100 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shrink-0"
  />
));
EmojiTriggerButton.displayName = "EmojiTriggerButton";

// ── Reaction popover ──────────────────────────────────────────────────────────
function ReactionPopover({
  messageId,
  align,
  onReact,
}: {
  messageId: string;
  align: "start" | "end";
  onReact: (messageId: string, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isFirefox = useIsFirefox();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <EmojiTriggerButton
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <IconMoodSmile
            size={14}
            className="text-zinc-500 dark:text-zinc-400"
          />
        </EmojiTriggerButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align={align}
          sideOffset={8}
          onContextMenu={(e) => e.stopPropagation()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 drop-shadow-xl"
        >
          {isFirefox ? (
            <EmojiPicker
              onEmojiClick={(d) => {
                onReact(messageId, d.emoji);
                setOpen(false);
              }}
              skinTonesDisabled
              searchDisabled
              height={380}
              width={300}
              theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            />
          ) : (
            <EmojiPicker
              reactionsDefaultOpen
              allowExpandReactions={false}
              searchDisabled
              onReactionClick={(d) => {
                onReact(messageId, d.emoji);
                setOpen(false);
              }}
              onEmojiClick={(d) => {
                onReact(messageId, d.emoji);
                setOpen(false);
              }}
              theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// ── Reaction helpers ──────────────────────────────────────────────────────────
function groupReactions(
  reactions: Message["reactions"],
): { emoji: string; count: number; userIds: string[] }[] {
  if (!reactions || typeof reactions !== "object" || Array.isArray(reactions))
    return [];
  return Object.entries(reactions).map(([emoji, entries]) => ({
    emoji,
    count: entries.length,
    userIds: entries.map((e) => (typeof e === "string" ? e : e.userId)),
  }));
}

function ReactionStrip({
  reactions,
  currentUserId,
  onReact,
  messageId,
}: {
  reactions: Message["reactions"];
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  messageId: string;
}) {
  const grouped = useMemo(() => groupReactions(reactions), [reactions]);
  if (!grouped.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {grouped.map(({ emoji, count, userIds }) => {
        const iReacted = userIds.includes(currentUserId);
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact(messageId, emoji)}
            className={[
              "flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors",
              iReacted
                ? "bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-600"
                : "bg-white/60 dark:bg-zinc-700/60 border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-600",
            ].join(" ")}
          >
            <span className="text-base leading-none">{emoji}</span>
            <span
              className="text-xs text-zinc-600 dark:text-zinc-300 font-medium tabular-nums overflow-hidden transition-all duration-150"
              style={{
                width: count > 1 ? "auto" : 0,
                opacity: count > 1 ? 1 : 0,
              }}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ src, fallback }: { src: string | null; fallback: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
      {src && !errored ? (
        <Image
          key={src}
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
          onError={() => setErrored(true)}
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

export function MessageList({
  messages,
  contact,
  currentUser,
  contactAvatar,
  myAvatarUrl,
  apiBase,
  styles,
  onMessagesChange,
  pendingReactionIds,
}: MessageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const [actionSheet, setActionSheet] = useState<{ msg: Message } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const optimisticReactionsRef = useRef<Map<string, Record<string, unknown[]>>>(
    new Map(),
  );

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingId]);

  const handleStartEdit = useCallback((msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.body ?? "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const handleSaveEdit = useCallback(
    async (msg: Message) => {
      if (!editText.trim() || editText.trim() === msg.body) {
        handleCancelEdit();
        return;
      }
      const trimmed = editText.trim();
      const result = await editMessage(msg.id, trimmed);
      if (!("error" in result)) {
        onMessagesChange?.((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, body: trimmed } : m)),
        );
      }
      handleCancelEdit();
    },
    [editText, onMessagesChange, handleCancelEdit],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      const result = await deleteMessage(messageId);
      if (!("error" in result)) {
        onMessagesChange?.((prev) => prev.filter((m) => m.id !== messageId));
      }
    },
    [onMessagesChange],
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const currentRxns: Record<string, unknown[]> =
        optimisticReactionsRef.current.get(messageId) ??
        (() => {
          const msg = messages.find((m) => m.id === messageId);
          if (!msg || isMissedCallMessage(msg as ChatItem)) return {};
          const m = msg as Message;
          return m.reactions &&
            typeof m.reactions === "object" &&
            !Array.isArray(m.reactions)
            ? (m.reactions as Record<string, unknown[]>)
            : {};
        })();

      const toId = (r: unknown) =>
        typeof r === "string" ? r : (r as { userId: string }).userId;
      const existing = currentRxns[emoji] ?? [];
      const existingIds = existing.map(toId);
      const isRemoving = existingIds.includes(currentUser.id);

      // Remove any previous reaction by this user on a different emoji
      const previousEmoji = Object.entries(currentRxns).find(
        ([e, entries]) =>
          e !== emoji &&
          (entries as unknown[]).map(toId).includes(currentUser.id),
      )?.[0];

      const updatedRxns = { ...currentRxns };
      if (previousEmoji) {
        const prev = ((currentRxns[previousEmoji] as unknown[]) ?? []).map(
          toId,
        );
        const filtered = prev.filter((id) => id !== currentUser.id);
        if (filtered.length === 0) delete updatedRxns[previousEmoji];
        else
          updatedRxns[previousEmoji] = filtered.map((id) => ({ userId: id }));
      }
      if (isRemoving) {
        const filtered = existingIds.filter((id) => id !== currentUser.id);
        if (filtered.length === 0) delete updatedRxns[emoji];
        else updatedRxns[emoji] = filtered.map((id) => ({ userId: id }));
      } else {
        const deduped = existingIds.filter((id) => id !== currentUser.id);
        updatedRxns[emoji] = [
          ...deduped.map((id) => ({ userId: id })),
          { userId: currentUser.id },
        ];
      }

      pendingReactionIds?.current.add(messageId);
      optimisticReactionsRef.current.set(messageId, updatedRxns);
      onMessagesChange?.((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reactions: updatedRxns as Message["reactions"] }
            : m,
        ),
      );

      try {
        await addMessageReaction(messageId, emoji);
      } finally {
        pendingReactionIds?.current.delete(messageId);
        optimisticReactionsRef.current.delete(messageId);
      }
    },
    [currentUser.id, messages, onMessagesChange],
  );

  const handleTouchStart = useCallback(
    (msg: Message) => () => {
      longPressTimerRef.current = setTimeout(() => {
        if (msg.fromUserId === currentUser.id) setActionSheet({ msg });
      }, 500);
    },
    [currentUser.id],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  return (
    <>
      <div className="space-y-5">
        {messages.map((item) => {
          if (isMissedCallMessage(item)) {
            return (
              <MissedCallBubble
                key={item.id}
                msg={item}
                isMeCaller={item.fromUserId === currentUser.id}
              />
            );
          }

          const msg = item as Message;
          const isMe = msg.fromUserId === currentUser.id;
          const isEditing = editingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`group/msgrow flex flex-col gap-0 ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex gap-2 items-center ${isMe ? "justify-end" : "justify-start"} w-full`}
              >
                {!isMe && (
                  <Avatar src={contactAvatar} fallback={contact.username[0]} />
                )}

                {isMe && !isEditing && (
                  <ReactionPopover
                    messageId={msg.id}
                    align="end"
                    onReact={handleReaction}
                  />
                )}

                <div className="flex flex-col shrink-0 max-w-[calc(100%-6rem)] md:max-w-[65%]">
                  <ContextMenu.Root>
                    <ContextMenu.Trigger asChild>
                      <div
                        onTouchStart={handleTouchStart(msg)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                      >
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <textarea
                              ref={editInputRef}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(msg);
                                }
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              rows={2}
                              className="w-full rounded-xl px-3 py-2 text-sm border border-blue-400 dark:border-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                className="text-xs px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg)}
                                className="text-xs px-2 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-4 py-3 ${isMe ? `${styles.sent} ${styles.sentText}` : `${styles.received} ${styles.receivedText}`}`}
                          >
                            <MessageContent
                              message={msg}
                              apiBase={apiBase}
                              className={
                                isMe ? styles.sentText : styles.receivedText
                              }
                            />
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[10px] opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {isMe && (
                                <span
                                  className={
                                    msg.readAt
                                      ? "text-[10px] text-green-400"
                                      : "text-[10px] opacity-70"
                                  }
                                >
                                  {msg.readAt ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </ContextMenu.Trigger>

                    {isMe && (
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-[140px] rounded-xl overflow-hidden p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-black/10 dark:shadow-black/40 z-50">
                          {!msg.attachment && (
                            <>
                              <ContextMenu.Item
                                onSelect={() => handleStartEdit(msg)}
                                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer select-none outline-none transition-colors"
                              >
                                <IconPencil
                                  size={14}
                                  className="shrink-0 text-zinc-500"
                                />
                                Edit
                              </ContextMenu.Item>
                              <ContextMenu.Separator className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                            </>
                          )}
                          <ContextMenu.Item
                            onSelect={() => handleDelete(msg.id)}
                            className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer select-none outline-none transition-colors"
                          >
                            <IconTrash size={14} className="shrink-0" />
                            Delete
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    )}
                  </ContextMenu.Root>
                </div>

                {!isMe && !isEditing && (
                  <ReactionPopover
                    messageId={msg.id}
                    align="start"
                    onReact={handleReaction}
                  />
                )}

                {isMe && (
                  <Avatar
                    src={myAvatarUrl}
                    fallback={currentUser.username[0]}
                  />
                )}
              </div>

              {!isEditing && (
                <div className={`${isMe ? "pr-13" : "pl-13"} mt-1`}>
                  <ReactionStrip
                    reactions={(msg as Message).reactions}
                    currentUserId={currentUser.id}
                    onReact={handleReaction}
                    messageId={msg.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {actionSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setActionSheet(null)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-white dark:bg-zinc-900 rounded-t-2xl p-4 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600 mx-auto mb-2" />
            {!actionSheet.msg.attachment && (
              <button
                onClick={() => {
                  handleStartEdit(actionSheet.msg);
                  setActionSheet(null);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <IconPencil size={18} className="text-zinc-500 shrink-0" />
                Edit message
              </button>
            )}
            <button
              onClick={() => {
                handleDelete(actionSheet.msg.id);
                setActionSheet(null);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <IconTrash size={18} className="shrink-0" />
              Delete message
            </button>
            <button
              onClick={() => setActionSheet(null)}
              className="mt-1 flex items-center justify-center px-4 py-3 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  const viewUrl =
    apiBase && message.attachment?.key
      ? `${apiBase}/uploads/view?key=${encodeURIComponent(message.attachment.key)}`
      : null;

  const size = message.attachment?.size || 0;
  function formatFileSize(bytes: number) {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  }

  if (isImageAttachment(message.attachment)) {
    if (!viewUrl) return <Skeleton className="size-65" />;
    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl max-w-65">
          {!imageLoaded && !imageErrored && <Skeleton className="size-65" />}
          {!imageErrored && (
            <Image
              src={viewUrl}
              alt="Image attachment"
              width={260}
              height={260}
              className={twMerge(
                "object-cover transition-opacity duration-200",
                imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0",
              )}
              unoptimized
              onLoadingComplete={() => {
                setImageLoaded(true);
                window.dispatchEvent(new Event("resize"));
              }}
              onError={() => setImageErrored(true)}
            />
          )}
          {imageErrored && (
            <div className="size-65 flex items-center justify-center rounded-xl bg-black/10 dark:bg-white/10 text-xs opacity-50">
              Failed to load
            </div>
          )}
        </div>
        {message.body && (
          <p className="text-[15px] leading-relaxed break-all">
            {linkify(message.body)}
          </p>
        )}
      </div>
    );
  }
  if (message.attachment?.type === "video") {
    if (!viewUrl) return <Skeleton className="w-65 h-45" />;
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
            {linkify(message.body)}
          </p>
        )}
      </div>
    );
  }
  if (message.attachment?.type === "audio") {
    if (!viewUrl) return <Skeleton className="w-55 h-12" />;
    return (
      <div className={twMerge("my-2", className)}>
        <AudioPlayer src={viewUrl} className={className} />
        {message.body && (
          <p className="mt-2 text-[15px] leading-relaxed break-all">
            {linkify(message.body)}
          </p>
        )}
      </div>
    );
  }
  if (message.attachment?.type === "file") {
    if (!viewUrl) return <Skeleton className="w-45 h-10" />;
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
    <p className="text-[15px] leading-relaxed break-all">
      {linkify(message.body)}
    </p>
  );
}

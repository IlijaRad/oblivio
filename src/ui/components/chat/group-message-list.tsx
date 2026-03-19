"use client";

import { GroupDetail, GroupMessage, User } from "@/lib/definitions";
import Image from "next/image";
import AudioPlayer from "../audio-player";
import linkify from "./linkify";

import {
  addGroupMessageReaction,
  deleteGroupMessage,
  editGroupMessage,
} from "@/lib/actions/groups/actions";
import * as ContextMenu from "@radix-ui/react-context-menu";
import * as Popover from "@radix-ui/react-popover";
import { IconMoodSmile, IconPencil, IconTrash } from "@tabler/icons-react";
import EmojiPicker from "emoji-picker-react";
import React, {
  Dispatch,
  SetStateAction,
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
    [key: string]: string;
  };
  onMessagesChange?: Dispatch<SetStateAction<GroupMessage[]>>;
  pendingReactionIds?: React.MutableRefObject<Set<string>>;
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
    className="size-7 pointer-events-auto flex items-center justify-center rounded-full border shadow-sm transition-all duration-150 opacity-0 group-hover/msgrow:opacity-100 [@media(hover:none)]:opacity-100 pointer-coarse:opacity-100 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shrink-0"
  />
));
EmojiTriggerButton.displayName = "EmojiTriggerButton";

function useIsFirefox() {
  return useMemo(
    () =>
      typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent),
    [],
  );
}

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
            />
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function groupReactions(
  reactions: GroupMessage["reactions"],
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
  reactions: GroupMessage["reactions"];
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

export function GroupMessageList({
  messages,
  group,
  currentUser,
  apiBase,
  styles,
  onMessagesChange,
  pendingReactionIds,
}: GroupMessageListProps) {
  const memberMap = new Map(group.members.map((m) => [m.userId, m]));
  const visibleMessages = messages.filter(
    (msg) => msg.fromUserId === currentUser.id || memberMap.has(msg.fromUserId),
  );

  const myAvatarUrl = currentUser.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(currentUser.avatarKey)}`
    : null;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingId]);

  const optimisticReactionsRef = useRef<Map<string, Record<string, unknown[]>>>(
    new Map(),
  );

  const safeMessagesChange = useCallback(
    (updater: SetStateAction<GroupMessage[]>) => {
      if (!onMessagesChange) return;
      if (typeof updater === "function") {
        onMessagesChange((prev) => {
          const next = updater(prev);
          return next.map((m) => {
            const optimistic = optimisticReactionsRef.current.get(m.id);
            if (optimistic === undefined) return m;
            return { ...m, reactions: optimistic as GroupMessage["reactions"] };
          });
        });
      } else {
        onMessagesChange(updater);
      }
    },
    [onMessagesChange],
  );

  const handleStartEdit = useCallback((msg: GroupMessage) => {
    setEditingId(msg.id);
    setEditText(msg.body ?? "");
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  const handleSaveEdit = useCallback(
    async (msg: GroupMessage) => {
      if (!editText.trim() || editText.trim() === msg.body) {
        handleCancelEdit();
        return;
      }
      const trimmed = editText.trim();
      const result = await editGroupMessage(group.id, msg.id, trimmed);
      if (!("error" in result)) {
        safeMessagesChange((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, body: trimmed } : m)),
        );
      }
      handleCancelEdit();
    },
    [editText, group.id, onMessagesChange, handleCancelEdit],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      const result = await deleteGroupMessage(group.id, messageId);
      if (!("error" in result)) {
        safeMessagesChange((prev) => prev.filter((m) => m.id !== messageId));
      }
    },
    [group.id, onMessagesChange],
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const currentRxns: Record<string, unknown[]> =
        optimisticReactionsRef.current.get(messageId) ??
        (() => {
          const msg = messages.find((m) => m.id === messageId);
          return msg?.reactions &&
            typeof msg.reactions === "object" &&
            !Array.isArray(msg.reactions)
            ? (msg.reactions as Record<string, unknown[]>)
            : {};
        })();

      const toId = (r: unknown) =>
        typeof r === "string" ? r : (r as { userId: string }).userId;

      const existing = currentRxns[emoji] ?? [];
      const existingIds = existing.map(toId);
      const isRemoving = existingIds.includes(currentUser.id);

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
        if (filtered.length === 0) {
          delete updatedRxns[previousEmoji];
        } else {
          updatedRxns[previousEmoji] = filtered.map((id) => ({ userId: id }));
        }
      }

      if (isRemoving) {
        const filtered = existingIds.filter((id) => id !== currentUser.id);
        if (filtered.length === 0) {
          delete updatedRxns[emoji];
        } else {
          updatedRxns[emoji] = filtered.map((id) => ({ userId: id }));
        }
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
        prev.map((m): GroupMessage => {
          if (m.id !== messageId) return m;
          return { ...m, reactions: updatedRxns as GroupMessage["reactions"] };
        }),
      );

      try {
        await addGroupMessageReaction(group.id, messageId, emoji);
      } finally {
        pendingReactionIds?.current.delete(messageId);
        optimisticReactionsRef.current.delete(messageId);
      }
    },
    [group.id, currentUser.id, messages, onMessagesChange],
  );

  const [actionSheet, setActionSheet] = useState<{
    msg: GroupMessage;
    isMine: boolean;
  } | null>(null);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = useCallback(
    (msg: GroupMessage, isMine: boolean) => () => {
      longPressTimerRef.current = setTimeout(() => {
        if (isMine) setActionSheet({ msg, isMine });
      }, 500);
    },
    [],
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
        {visibleMessages.map((msg, index) => {
          const isMine = msg.fromUserId === currentUser.id;
          const sender = memberMap.get(msg.fromUserId);
          const senderAvatarUrl = sender?.avatarKey
            ? `${apiBase}/uploads/view?key=${encodeURIComponent(sender.avatarKey)}`
            : null;
          const senderName = sender?.username ?? "Unknown";
          const isEditing = editingId === msg.id;

          return (
            <div
              key={msg.id ?? index}
              className={`group/msgrow flex flex-col gap-0 ${isMine ? "items-end" : "items-start"}`}
            >
              {!isMine && (
                <span className="text-xs text-gray-400 mb-1 ml-13">
                  {senderName}
                </span>
              )}

              <div
                className={`flex gap-2 items-center ${isMine ? "justify-end" : "justify-start"} max-w-full`}
              >
                {!isMine && (
                  <div className="size-11 shrink-0 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                    {senderAvatarUrl ? (
                      <Image
                        src={senderAvatarUrl}
                        alt={senderName}
                        fill
                        className="object-cover select-none"
                      />
                    ) : (
                      <span className="font-bold select-none text-zinc-900 dark:text-white uppercase">
                        {senderName[0]}
                      </span>
                    )}
                  </div>
                )}

                {isMine && !isEditing && (
                  <ReactionPopover
                    messageId={msg.id}
                    align="end"
                    onReact={handleReaction}
                  />
                )}

                <div className="flex flex-col shrink-0 max-w-[calc(100%-6rem)] md:max-w-[calc(100%-5.5rem)]">
                  <ContextMenu.Root>
                    <ContextMenu.Trigger asChild>
                      <div
                        onTouchStart={handleTouchStart(msg, isMine)}
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
                              <>{linkify(msg.body)}</>
                            )}
                            <div className="flex items-center justify-end gap-1.5 mt-1">
                              <span className="text-[10px] opacity-70">
                                {new Date(
                                  typeof msg.createdAt === "string"
                                    ? msg.createdAt
                                    : Number(msg.createdAt),
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </ContextMenu.Trigger>

                    {isMine && (
                      <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-35 rounded-xl overflow-hidden p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl shadow-black/10 dark:shadow-black/40 z-50">
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

                {!isMine && !isEditing && (
                  <ReactionPopover
                    messageId={msg.id}
                    align="start"
                    onReact={handleReaction}
                  />
                )}

                {isMine && (
                  <div className="size-11 shrink-0 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                    {myAvatarUrl ? (
                      <Image
                        src={myAvatarUrl}
                        alt="You"
                        width={44}
                        height={44}
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

              {!isEditing && (
                <div className={`${isMine ? "pr-13" : "pl-13"} mt-1`}>
                  <ReactionStrip
                    reactions={msg.reactions}
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
      <div className="relative overflow-hidden rounded-xl max-w-full md:max-w-65">
        <Image
          src={url}
          alt={attachment.name ?? "image"}
          width={260}
          height={260}
          className="rounded-lg object-cover max-w-wull"
        />
      </div>
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
    return (
      <div className="relative overflow-hidden rounded-xl max-w-65">
        <video
          src={url}
          controls
          width={260}
          height={260}
          className="object-cover rounded-lg"
        />
      </div>
    );
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

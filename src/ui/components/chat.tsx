"use client";

import { useWebSocket } from "@/context/WebSocketProvider";
import { deleteContact } from "@/lib/actions/friends/remove-friend";
import { burnChat } from "@/lib/actions/thread/burn";
import { getChat } from "@/lib/actions/thread/get-chat";
import { sendMessage } from "@/lib/actions/thread/send-message";
import {
  GetChatResult,
  isImageAttachment,
  Message,
  SelectedContact,
  User,
} from "@/lib/definitions";
import { getOrCreateDeviceId } from "@/lib/device";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import {
  IconArrowLeft,
  IconDotsVertical,
  IconMicrophone,
  IconMoodSmile,
  IconPaperclip,
  IconSend,
  IconX,
} from "@tabler/icons-react";
import EmojiPicker from "emoji-picker-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Theme = "default" | "modern";

const themeStyles = {
  default: {
    chatBg: "bg-white dark:bg-zinc-900",
    sent: "bg-[linear-gradient(88deg,#944C16_0%,#0D0D0F_40.75%)] text-white",
    received:
      "bg-gray-200/90 text-gray-900 dark:bg-zinc-700 dark:text-white shadow-sm",
    time: "text-amber-600/80 dark:text-amber-500/80",
    inputBorder: "border-amber-800/50 dark:border-amber-900/50",
    inputBg: "bg-transparent",
    headerText: "dark:text-white text-gray-900",
  },
  modern: {
    chatBg: "bg-white dark:bg-zinc-900",
    sent: "bg-gradient-to-r from-gray-700 to-gray-900 text-white",
    received:
      "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm",
    time: "text-gray-500 dark:text-gray-400",
    inputBorder: "border-black/20 dark:border-white/20",
    inputBg: "bg-white dark:bg-zinc-900",
    headerText: "text-zinc-900 dark:text-white",
  },
};

type ChatStyles = (typeof themeStyles)[keyof typeof themeStyles];

const THEME_STORAGE_KEY = "chat-theme-preference";

export default function Chat({
  contact,
  currentUser,
}: {
  contact: SelectedContact;
  currentUser: User;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const { addListener } = useWebSocket();

  const contactAvatar = contact.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(contact.avatarKey)}`
    : null;

  const myAvatarUrl = currentUser.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(currentUser.avatarKey)}`
    : null;

  const [theme, setTheme] = useState<Theme>("default");
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const result = await sendMessage(contact.id, inputValue, deviceId);

      if ("error" in result) {
        toast.error(result.error);
      } else {
        setInputValue("");

        const newMessage: Message = {
          id: result.id,
          fromUserId: result.fromUserId,
          toUserId: result.toUserId,
          body: result.body,
          createdAt: result.createdAt,
          readAt: result.readAt ?? null,
          attachment: result.attachment ?? null,
        };

        setMessages((prev) => [...prev, newMessage]);

        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 50);
      }
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    async function loadThread() {
      const response = (await getChat(contact.id)) as GetChatResult;

      if (response && "items" in response) {
        setMessages(response.items);

        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      } else if (response && "errors" in response) {
        toast.error("Failed to load messages");
      }
    }
    loadThread();
  }, [contact.id]);

  async function handleBurnChat() {
    const res = await burnChat(contact.id);

    if (res && res.success) {
      toast.success("Chat burned successfully");
      router.push("/");
    }
  }

  async function handleDeleteContact() {
    if (!confirm(`Are you sure you want to remove ${contact.username}?`))
      return;

    const res = await deleteContact(contact.id);
    if (res.success) {
      toast.success("Contact removed");
    } else {
      toast.error(res.error || "Failed to remove contact");
    }

    router.refresh();
  }

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const validThemes: Theme[] = ["default", "modern"];

    startTransition(() => {
      if (saved && validThemes.includes(saved)) {
        setTheme(saved);
      }
    });
  }, [currentUser.id, contact.id]);

  useEffect(() => {
    const remove = addListener((payload) => {
      if (payload.type === "seen") {
        if (String(payload.with) !== contact.id) return;
        if (
          payload.type === "seen" &&
          payload.with &&
          typeof payload.upTo === "number"
        ) {
          if (String(payload.with) !== contact.id) return;

          setMessages((prev) =>
            prev.map((m) =>
              m.fromUserId === currentUser.id &&
              m.toUserId === String(payload.with) &&
              new Date(m.createdAt).getTime() <= payload.upTo
                ? { ...m, readAt: new Date(payload.upTo).toISOString() }
                : m,
            ),
          );
          return;
        }
        return;
      }

      if (!payload.id) return;

      const isForThisChat =
        (payload.fromUserId === currentUser.id &&
          payload.toUserId === contact.id) ||
        (payload.fromUserId === contact.id &&
          payload.toUserId === currentUser.id);

      if (!isForThisChat) return;

      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, payload];
      });
    });

    return remove;
  }, [contact.id, currentUser.id]);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  const styles = themeStyles[theme];

  return (
    <div className="flex-1 lg:mr-8">
      <div className={`size-full rounded-md flex flex-col ${styles.chatBg} `}>
        <div className="flex items-center justify-between shrink-0 p-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="lg:hidden flex items-center justify-center rounded-md size-9 mr-1 text-zinc-900 dark:text-white hover:bg-black/5 transition-colors"
              aria-label="Back to contacts"
            >
              <IconArrowLeft size={24} />
            </Link>

            <div className="size-10 md:size-11 rounded-md bg-gray-100/80 dark:bg-zinc-800/80 flex items-center justify-center shadow-sm overflow-hidden relative shrink-0">
              {contactAvatar ? (
                <Image
                  src={contactAvatar}
                  alt={contact.username}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span className={`text-lg font-medium ${styles.headerText}`}>
                  {contact.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className={`font-medium truncate ${styles.headerText}`}>
                {contact.username}
              </span>
              <span className="text-[10px] opacity-60 dark:text-white text-black">
                Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="size-9 rounded-md bg-green-500/90 hover:bg-green-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <path
                  d="M7.35657 2.92031C7.09735 2.30016 6.42142 1.97203 5.77829 2.14594L5.59782 2.19516C3.47814 2.77266 1.66689 4.82672 2.19517 7.32703C3.41251 13.0692 7.93079 17.5875 13.673 18.8048C16.1766 19.3364 18.2274 17.5219 18.8049 15.4022L18.8541 15.2217C19.0313 14.5753 18.6999 13.8994 18.083 13.6434L14.8903 12.3145C14.3489 12.0881 13.7222 12.2456 13.3481 12.7017L12.0816 14.2505C9.77486 13.1053 7.91767 11.1891 6.85126 8.83641L8.30157 7.65516C8.75767 7.28438 8.91189 6.65766 8.68876 6.11297L7.35657 2.92031Z"
                  fill="white"
                />
              </svg>
            </button>
            <button className="size-9 rounded-md bg-blue-500/90 hover:bg-blue-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
                <path
                  d="M4.2001 4.2C3.04182 4.2 2.1001 5.14172 2.1001 6.3V14.7C2.1001 15.8583 3.04182 16.8 4.2001 16.8H12.6001C13.7584 16.8 14.7001 15.8583 14.7001 14.7V6.3C14.7001 5.14172 13.7584 4.2 12.6001 4.2H4.2001ZM16.2751 13.125L18.6868 15.0544C18.8246 15.1659 18.9953 15.225 19.1724 15.225C19.6023 15.225 19.9501 14.8772 19.9501 14.4473V6.55265C19.9501 6.12281 19.6023 5.775 19.1724 5.775C18.9953 5.775 18.8246 5.83406 18.6868 5.94562L16.2751 7.875V13.125Z"
                  fill="white"
                />
              </svg>
            </button>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="size-9 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center outline-none">
                  <IconDotsVertical size={20} className={styles.headerText} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={6}
                  className="min-w-48 p-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl border border-black/10 dark:border-white/10 shadow-2xl z-50"
                >
                  <DropdownMenu.Label className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Theme
                  </DropdownMenu.Label>
                  {(["default", "modern"] as Theme[]).map((t) => (
                    <DropdownMenu.Item
                      key={t}
                      onClick={() => handleThemeChange(t)}
                      className={`px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors flex items-center justify-between ${
                        theme === t
                          ? "bg-black/10 dark:bg-white/10 font-medium"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>{t === "default" ? "Default" : "Modern"}</span>
                      {theme === t && (
                        <span className="text-xs opacity-70">✓</span>
                      )}
                    </DropdownMenu.Item>
                  ))}
                  <DropdownMenu.Separator className="my-1.5 h-px bg-black/10 dark:bg-white/10 mx-1" />
                  <DropdownMenu.Item
                    onClick={handleDeleteContact}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer outline-none"
                  >
                    Remove Contact
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={handleBurnChat}
                    className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer outline-none"
                  >
                    Burn Chat
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <Link
              className="hidden lg:flex size-9 rounded-md hover:bg-black/5 items-center justify-center"
              href="/"
            >
              <IconX size={20} className={styles.headerText} />
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-5 space-y-5 px-4 scroll-smooth"
        >
          {messages.length > 0 ? (
            <div className="space-y-5">
              {messages.map((msg) => {
                const isMe = msg.fromUserId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 items-start ${isMe ? "justify-end" : ""}`}
                  >
                    {!isMe && (
                      <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                        {contactAvatar ? (
                          <Image
                            src={contactAvatar}
                            fill
                            alt=""
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="font-bold text-zinc-900 dark:text-white uppercase">
                            {contact.username[0]}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="max-w-[78%] md:max-w-[65%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${isMe ? styles.sent : styles.received}`}
                      >
                        <MessageContent message={msg} apiBase={apiBase} />
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
                      <div className="size-11 rounded-md bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 relative overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                        {myAvatarUrl ? (
                          <Image
                            src={myAvatarUrl}
                            fill
                            alt="Me"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="font-bold text-zinc-900 dark:text-white uppercase">
                            {currentUser.username[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState contact={contact} styles={styles} />
          )}
        </div>

        <div className="flex gap-3 p-4 shrink-0">
          <div
            className={`flex-1 h-12 rounded-md border ${styles.inputBorder} ${styles.inputBg} flex items-center pl-5 pr-2 gap-2`}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-[15px] outline-none dark:text-white"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <label
              className="hover:opacity-75 cursor-pointer p-2"
              aria-label="Attach a file"
            >
              <IconPaperclip
                size={20}
                className="text-zinc-500 dark:text-zinc-400"
              />
              <input type="file" className="hidden" />
            </label>

            <Popover.Root
              open={emojiPickerOpen}
              onOpenChange={setEmojiPickerOpen}
            >
              <Popover.Trigger
                className="cursor-pointer p-2 hover:opacity-75"
                aria-label="Send emoji"
              >
                <IconMoodSmile
                  size={20}
                  className="text-zinc-500 dark:text-zinc-400"
                />
              </Popover.Trigger>
              <Popover.Content
                side="top"
                align="end"
                sideOffset={12}
                className="z-50 drop-shadow-xl"
              >
                <EmojiPicker
                  onEmojiClick={(emoji) => {
                    setInputValue((value) => (value += emoji.emoji));
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                />
              </Popover.Content>
            </Popover.Root>
          </div>

          <button
            className="size-12 shrink-0 rounded-md bg-[linear-gradient(88deg,#944C16_0%,#0D0D0F_40.75%)] text-white flex items-center justify-center hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:grayscale cursor-pointer"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            aria-label="Send message"
          >
            {isSending ? (
              <div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : inputValue.trim() ? (
              <IconSend size={22} />
            ) : (
              <IconMicrophone size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const EmptyState = ({
  contact,
  styles,
}: {
  contact: SelectedContact;
  styles: ChatStyles;
}) => (
  <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in fade-in zoom-in-95 duration-500">
    <div className="size-20 rounded-full bg-transparent flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-white/5">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-400"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
    <h3 className={`text-lg font-medium ${styles.headerText}`}>
      No messages yet
    </h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-60">
      Say hi to&nbsp;
      <span className="font-semibold text-zinc-700 dark:text-zinc-200">
        @{contact.username}
      </span>
      &nbsp; to start the conversation!
    </p>
  </div>
);

function MessageContent({
  message,
  apiBase,
}: {
  message: Message;
  apiBase?: string;
}) {
  if (isImageAttachment(message.attachment)) {
    const imageUrl = `${apiBase}/uploads/view?key=${encodeURIComponent(
      message.attachment.key,
    )}`;

    return (
      <div className="space-y-2">
        <div className="relative overflow-hidden rounded-xl max-w-65">
          <Image
            src={imageUrl}
            alt="Image attachment"
            width={260}
            height={260}
            className="object-cover"
            unoptimized
          />
        </div>

        {message.body && (
          <p className="text-[15px] leading-relaxed wrap-break-word">
            {message.body}
          </p>
        )}
      </div>
    );
  }

  return (
    <p className="text-[15px] leading-relaxed wrap-break-word">
      {message.body}
    </p>
  );
}

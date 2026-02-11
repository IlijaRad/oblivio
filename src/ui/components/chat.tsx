"use client";

import { useWebSocket } from "@/context/WebSocketProvider";
import { deleteContact } from "@/lib/actions/friends/remove-friend";
import { burnChat } from "@/lib/actions/thread/burn";
import { getChat } from "@/lib/actions/thread/get-chat";
import { markAsSeen } from "@/lib/actions/thread/seen";
import { sendMessage } from "@/lib/actions/thread/send-message";
import { getPresignedUploadUrl } from "@/lib/actions/upload/presign";
import { calls, CallState, IncomingOffer } from "@/lib/calls";
import {
  GetChatResult,
  isImageAttachment,
  Message,
  SelectedContact,
  User,
} from "@/lib/definitions";
import { getOrCreateDeviceId } from "@/lib/device";
import {
  isCallEvent,
  isFriendEvent,
  isMessageEvent,
  isSeenEvent,
} from "@/lib/websocket";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import {
  IconArrowLeft,
  IconDotsVertical,
  IconMoodSmile,
  IconPaperclip,
  IconX,
} from "@tabler/icons-react";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import IconCamera from "../icons/icon-camera";
import IconLock from "../icons/icon-lock";
import IconPhone from "../icons/icon-phone";
import AudioPlayer from "./audio-player";
import ButtonSend from "./chat/button-send";
import IconButton from "./icon-button";
import IncomingCall from "./incoming-call";

type Theme = "default" | "modern";

const themeStyles = {
  default: {
    chatBg: "bg-white dark:bg-zinc-900",
    sent: "bg-[linear-gradient(88deg,#944C16_0%,#0D0D0F_40.75%)]",
    sentText: "text-white",
    received: "bg-[#f1f1f1] dark:bg-zinc-800 shadow-sm",
    receivedText: "text-gray-900 dark:text-white",
    time: "text-amber-600/80 dark:text-amber-500/80",
    inputBorder: "border-black/20 dark:border-white/20",
    inputBg: "bg-transparent",
    headerText: "dark:text-white text-gray-900",
  },
  modern: {
    chatBg: "bg-white dark:bg-zinc-900",
    sent: "bg-gradient-to-r from-gray-700 to-gray-900",
    sentText: "text-white",
    received: "bg-[#f1f1f1] dark:bg-zinc-800 shadow-sm",
    receivedText: "text-zinc-900 dark:text-white",
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
  token,
}: {
  contact: SelectedContact;
  currentUser: User;
  token?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { push } = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const { addListener } = useWebSocket();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<Theme>("default");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [incoming, setIncoming] = useState<IncomingOffer | null>(null);
  const [callState, setCallState] = useState<CallState>({
    active: false,
    connected: false,
    hasVideo: false,
    micMuted: false,
    cameraOn: false,
    callId: null,
    withUserId: null,
  });

  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);

  const contactAvatar = contact.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(contact.avatarKey)}`
    : null;

  const myAvatarUrl = currentUser.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(currentUser.avatarKey)}`
    : null;

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

  async function uploadToS3(file: File): Promise<{ key: string } | null> {
    try {
      const normalizedType = (file.type || "application/octet-stream").split(
        ";",
      )[0];

      const data = await getPresignedUploadUrl({
        folder: "uploads",
        contentType: normalizedType,
        contentLength: file.size,
      });

      if (data.error || !data.url) {
        toast.error(data.error || "Upload failed");
        return null;
      }

      const putUrl: string = data.url;
      const key: string = data.key;

      const res = await fetch(putUrl, {
        method: "PUT",
        headers: { "Content-Type": normalizedType },
        body: file,
      });

      if (!res.ok) {
        toast.error(`Upload failed (HTTP ${res.status})`);
        return null;
      }

      return { key };
    } catch (e) {
      console.error("Upload failed", e);
      toast.error("Upload failed");
      return null;
    }
  }

  async function handleFileUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const mime = file.type || "";
      let attachmentType: "image" | "video" | "audio" | "file" = "file";

      if (mime.startsWith("image/")) attachmentType = "image";
      else if (mime.startsWith("video/")) attachmentType = "video";
      else if (mime.startsWith("audio/")) attachmentType = "audio";

      const upload = await uploadToS3(file);
      if (!upload) return;

      const deviceId = await getOrCreateDeviceId();
      const result = await sendMessage(contact.id, "", deviceId, {
        attachmentKey: upload.key,
        attachmentType: attachmentType,
        attachmentName: file.name,
        attachmentSize: file.size,
      });

      if ("error" in result) {
        toast.error(result.error);
      } else {
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
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  useEffect(() => {
    async function loadThread() {
      const response = (await getChat(contact.id)) as GetChatResult;

      if (response && "items" in response) {
        setMessages(response.items);
        handleMarkAsSeen(response.items);

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

  useEffect(() => {
    if (token) {
      calls.setToken(token);
    }
  }, [token]);

  useEffect(() => {
    calls.setIncomingHandler((offer) => {
      console.log("Incoming call offer", offer);
      setIncoming(offer);
    });

    const onStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<CallState>;
      setCallState(customEvent.detail);
    };

    window.addEventListener("calls:accepted", () => setIncoming(null));
    window.addEventListener("calls:state", onStateChange);

    return () => {
      window.addEventListener("calls:accepted", () => setIncoming(null));
      window.removeEventListener("calls:state", onStateChange);
    };
  }, []);

  async function handleBurnChat() {
    const res = await burnChat(contact.id);

    if (res && res.success) {
      toast.success("Chat burned successfully");
      push("/");
    }
  }

  async function handleDeleteContact() {
    if (!confirm(`Are you sure you want to remove ${contact.username}?`))
      return;

    const res = await deleteContact(contact.id);
    if (res.success) {
      toast.success("Contact removed");
      push("/");
    } else {
      toast.error(res.error || "Failed to remove contact");
    }
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
      if (isSeenEvent(payload)) {
        if (String(payload.with) !== contact.id) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.fromUserId === currentUser.id &&
            m.toUserId === String(payload.with) &&
            m.createdAt <= payload.upTo
              ? { ...m, readAt: new Date(payload.upTo).toISOString() }
              : m,
          ),
        );
        return;
      }

      if (isFriendEvent(payload)) return;

      if (isCallEvent(payload)) return;

      if (isMessageEvent(payload)) {
        const isForThisChat =
          (payload.fromUserId === currentUser.id &&
            payload.toUserId === contact.id) ||
          (payload.fromUserId === contact.id &&
            payload.toUserId === currentUser.id);

        if (!isForThisChat) return;

        if (payload.fromUserId === contact.id) {
          markAsSeen(contact.id, payload.createdAt);
        }

        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;

          return [...prev, payload];
        });
      }
    });
    return remove;
  }, [contact.id, currentUser.id, addListener]);

  const handleMarkAsSeen = async (msgs: Message[]) => {
    if (msgs.length === 0) return;

    const lastReceived = [...msgs]
      .reverse()
      .find((m) => m.fromUserId === contact.id);

    if (lastReceived) {
      await markAsSeen(contact.id, new Date(lastReceived.createdAt).getTime());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        if (audioBlob.size < 1000) return;

        const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        const upload = await uploadToS3(file);
        if (upload) {
          const deviceId = await getOrCreateDeviceId();
          const result = await sendMessage(contact.id, "", deviceId, {
            attachmentKey: upload.key,
            attachmentType: "audio",
            attachmentName: file.name,
            attachmentSize: file.size,
          });

          if (!("error" in result)) {
            setMessages((prev) => [...prev, result as Message]);
          }
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;

      const isNearBottom =
        scrollContainer.scrollHeight - scrollContainer.scrollTop <=
        scrollContainer.clientHeight + 400;

      if (isNearBottom) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [messages.length]);

  useEffect(() => {
    if (!callState.active) return;

    const r = remoteRef.current;
    const l = localRef.current || undefined;
    if (r) calls.attachElements(r, l);
  }, [callState.active]);

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
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton
              className="size-9 bg-green-500/90 hover:bg-green-600"
              onClick={async () => {
                if (!contact) return;
                try {
                  await calls.startCall(contact.id, false);
                } catch {
                  toast.error("Call failed");
                }
              }}
              aria-label="Start voice call"
            >
              <IconPhone />
            </IconButton>
            <IconButton
              className="size-9 bg-blue-500/90 hover:bg-blue-600"
              onClick={async () => {
                if (!contact) return;
                try {
                  await calls.startCall(contact.id, true);
                } catch {
                  toast.error("Video call failed");
                }
              }}
              aria-label="Start video call"
            >
              <IconCamera />
            </IconButton>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <IconButton className="size-9 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <IconDotsVertical size={20} className={styles.headerText} />
                </IconButton>
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
                        className={`rounded-2xl px-4 py-3 ${isMe ? `${styles.sent} ${styles.sentText}` : `${styles.received} ${styles.receivedText}`}`}
                      >
                        <MessageContent
                          message={msg}
                          apiBase={apiBase}
                          className={`${isMe ? styles.sentText : styles.receivedText}`}
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

        <div className="flex gap-3 p-4 w-full">
          <div
            className={`relative w-full pl-4 max-w-full pr-28 h-12 rounded-md border ${styles.inputBorder} ${styles.inputBg} flex items-center gap-2`}
          >
            {isRecording ? (
              <div className="flex items-center gap-2 w-full animate-pulse">
                <div className="size-2 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-500">
                  {Math.floor(recordingTime / 60)}:
                  {(recordingTime % 60).toString().padStart(2, "0")}
                </span>
              </div>
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="block bg-transparent md:max-w-none w-full text-[15px] outline-none dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
            )}

            <div className="absolute flex items-center gap-x-2 w-fit right-2 top-1">
              <label
                className={`hover:opacity-75 cursor-pointer p-2 ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
                aria-label="Attach a file"
              >
                <IconPaperclip
                  size={20}
                  className="text-zinc-500 dark:text-zinc-400"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
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
                    theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                    skinTonesDisabled
                    style={
                      {
                        ...(isDark
                          ? {
                              "--epr-bg-color": "var(--color-zinc-900)",
                              "--epr-picker-border-color":
                                "rgba(255,255,255,0.2)",
                              "--epr-category-label-bg-color":
                                "var(--color-zinc-900)",
                            }
                          : {
                              "--epr-bg-color": "white",
                              "--epr-picker-border-color": "rgba(0,0,0,0.2)",
                            }),
                      } as React.CSSProperties
                    }
                  />
                </Popover.Content>
              </Popover.Root>
            </div>
          </div>

          <ButtonSend
            inputValue={inputValue}
            isSending={isSending}
            isUploading={isUploading}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            handleSendMessage={handleSendMessage}
            styles={styles}
          />
        </div>
      </div>
      {incoming &&
        createPortal(
          <IncomingCall
            type={incoming.hasVideo ? "video" : "audio"}
            callerName={contact?.username || incoming.fromUserId}
            onAccept={async () => {
              try {
                await calls.acceptOffer(incoming);
                setIncoming(null);
              } catch (e) {
                console.error(e);
                toast.error("Failed to accept call");
              }
            }}
            onReject={() => {
              setIncoming(null);
            }}
            onToggle={() => {}}
          />,
          document.body,
        )}

      {callState.active &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-black z-2000 flex flex-col"
          >
            <div className="relative w-full h-full">
              <video
                ref={remoteRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />

              {callState.hasVideo && (
                <video
                  ref={localRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute right-4 bottom-20 w-40 h-30 object-cover rounded-lg border-2 border-white/60"
                />
              )}

              <div className="absolute top-4 left-4 text-white bg-black/40 px-3 py-2 rounded-lg">
                <div>{callState.connected ? "Connected" : "Connecting..."}</div>
                <div className="text-sm opacity-80">
                  {contact?.username || callState.withUserId}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-6">
                <button
                  onClick={() => calls.toggleMic()}
                  className={`px-6 py-3 rounded-full ${
                    callState.micMuted ? "bg-red-500" : "bg-gray-700"
                  } text-white`}
                >
                  {callState.micMuted ? "Unmute" : "Mute"}
                </button>

                {callState.hasVideo && (
                  <button
                    onClick={() => calls.toggleCamera()}
                    className={`px-6 py-3 rounded-full ${
                      callState.cameraOn ? "bg-gray-700" : "bg-red-500"
                    } text-white`}
                  >
                    {callState.cameraOn ? "Camera Off" : "Camera On"}
                  </button>
                )}

                <button
                  onClick={() => calls.endCall("hangup")}
                  className="px-6 py-3 rounded-full bg-red-600 text-white"
                >
                  End Call
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function EmptyState({
  contact,
  styles,
}: {
  contact: SelectedContact;
  styles: ChatStyles;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="size-20 rounded-full bg-transparent flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-white/20">
        <IconLock />
      </div>
      <h3 className={`text-lg font-medium ${styles.headerText}`}>
        No messages yet
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-60">
        Say hi to&nbsp;
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {contact.username}
        </span>
        &nbsp; to start the conversation!
      </p>
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
            onLoadingComplete={() => {
              window.dispatchEvent(new Event("resize"));
            }}
          />
        </div>
        {message.body && (
          <p className="text-[15px] leading-relaxed break-all hyphens-auto">
            {message.body}
          </p>
        )}
      </div>
    );
  }
  if (message.attachment?.type === "audio") {
    const audioUrl = `${apiBase}/uploads/view?key=${encodeURIComponent(message.attachment.key)}`;
    return (
      <div className={twMerge("my-2", className)}>
        <AudioPlayer src={audioUrl} className={className} />
        {message.body && (
          <p className="mt-2 text-[15px] leading-relaxed break-all hyphens-auto">
            {message.body}
          </p>
        )}
      </div>
    );
  }
  return (
    <p className="text-[15px] leading-relaxed break-all hyphens-auto">
      {message.body}
    </p>
  );
}

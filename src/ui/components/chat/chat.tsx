"use client";

import { useWebSocket } from "@/context/WebSocketProvider";
import { deleteContact } from "@/lib/actions/friends/remove-friend";
import { burnChat } from "@/lib/actions/thread/burn";
import { getChat } from "@/lib/actions/thread/get-chat";
import { markAsSeen } from "@/lib/actions/thread/seen";
import { sendMessage } from "@/lib/actions/thread/send-message";
import { getPresignedUploadUrl } from "@/lib/actions/upload/presign";
import { MissedCallEvent } from "@/lib/calls";
import {
  GetChatResult,
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
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ChatHeader from "./chat-header";
import ChatInput from "./chat-input";
import EmptyState from "./empy-state";
import {
  ChatItem,
  isMissedCallMessage,
  MessageList,
  MissedCallMessage,
} from "./message-list";

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

const THEME_STORAGE_KEY = "chat-theme-preference";

export default function Chat({
  contact,
  currentUser,
}: {
  contact: SelectedContact;
  currentUser: User;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopRequestedRef = useRef(false);

  const { push } = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { addListener } = useWebSocket();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [theme, setTheme] = useState<Theme>("default");

  const contactAvatar = contact.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(contact.avatarKey)}`
    : null;
  const myAvatarUrl = currentUser.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(currentUser.avatarKey)}`
    : null;
  const mimeTypeRef = useRef<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const validThemes: Theme[] = ["default", "modern"];
    startTransition(() => {
      if (saved && validThemes.includes(saved)) setTheme(saved);
    });
  }, [currentUser.id, contact.id]);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  };

  useEffect(() => {
    async function loadThread() {
      const response = (await getChat(contact.id)) as GetChatResult;
      if (response && "items" in response) {
        setMessages(response.items);
        handleMarkAsSeen(response.items);
        setTimeout(() => scrollToBottom(), 100);
      } else if (response && "errors" in response) {
        toast.error("Failed to load messages");
      }
    }
    loadThread();
  }, [contact.id]);

  useEffect(() => {
    const remove = addListener((payload) => {
      if (isSeenEvent(payload)) {
        if (String(payload.with) !== contact.id) return;
        setMessages((prev) =>
          prev.map((m) => {
            if (isMissedCallMessage(m)) return m;
            return m.fromUserId === currentUser.id &&
              m.toUserId === String(payload.with) &&
              m.createdAt <= payload.upTo
              ? { ...m, readAt: new Date(payload.upTo).toISOString() }
              : m;
          }),
        );
        return;
      }
      if (isFriendEvent(payload) || isCallEvent(payload)) return;
      if (isMessageEvent(payload)) {
        const isForThisChat =
          (payload.fromUserId === currentUser.id &&
            payload.toUserId === contact.id) ||
          (payload.fromUserId === contact.id &&
            payload.toUserId === currentUser.id);
        if (!isForThisChat) return;
        if (payload.fromUserId === contact.id)
          markAsSeen(contact.id, payload.createdAt);
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      }
    });
    return remove;
  }, [contact.id, currentUser.id, addListener]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<MissedCallEvent>).detail;
      if (detail.withUserId !== contact.id) return;
      const missedMsg: MissedCallMessage = {
        id: `missed-${detail.callId}`,
        type: "missed-call",
        hasVideo: detail.hasVideo,
        fromUserId: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, missedMsg]);
      setTimeout(() => scrollToBottom(), 50);
    };
    window.addEventListener("calls:missed", handler);
    return () => window.removeEventListener("calls:missed", handler);
  }, [contact.id, currentUser.id]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const isNearBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 400;
    if (isNearBottom) scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

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
        setMessages((prev) => [
          ...prev,
          {
            id: result.id,
            fromUserId: result.fromUserId,
            toUserId: result.toUserId,
            body: result.body,
            createdAt: result.createdAt,
            readAt: result.readAt ?? null,
            attachment: result.attachment ?? null,
          },
        ]);
        setTimeout(() => scrollToBottom(), 50);
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
      const res = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": normalizedType },
        body: file,
      });
      if (!res.ok) {
        toast.error(`Upload failed (HTTP ${res.status})`);
        return null;
      }
      return { key: data.key };
    } catch {
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
        attachmentType,
        attachmentName: file.name,
        attachmentSize: file.size,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: result.id,
            fromUserId: result.fromUserId,
            toUserId: result.toUserId,
            body: result.body,
            createdAt: result.createdAt,
            readAt: result.readAt ?? null,
            attachment: result.attachment ?? null,
          },
        ]);
        setTimeout(() => scrollToBottom(), 50);
      }
    } finally {
      setIsUploading(false);
      ev.target.value = "";
    }
  }

  const startRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordingTime(0);
    stopRequestedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stopRequestedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const mimeType =
        [
          "audio/mp4",
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/ogg;codecs=opus",
        ].find((type) => MediaRecorder.isTypeSupported(type)) ?? "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mimeTypeRef.current = mediaRecorder.mimeType;

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const actualMime = mediaRecorder.mimeType.split(";")[0].trim();
        const audioBlob = new Blob(audioChunksRef.current, {
          type: actualMime,
        });

        if (audioBlob.size < 1000) return;

        const ext = actualMime.includes("mp4")
          ? "m4a"
          : actualMime.includes("ogg")
            ? "ogg"
            : "webm";

        const file = new File([audioBlob], `voice-${Date.now()}.${ext}`, {
          type: actualMime,
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
          if (!("error" in result))
            setMessages((prev) => [...prev, result as Message]);
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      if (stopRequestedRef.current) {
        mediaRecorder.stop();
        setIsRecording(false);
        setRecordingTime(0);
        return;
      }

      timerRef.current = setInterval(
        () => setRecordingTime((prev) => prev + 1),
        1000,
      );
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    stopRequestedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleMarkAsSeen = async (msgs: ChatItem[]) => {
    const real = msgs.filter((m): m is Message => !isMissedCallMessage(m));
    if (!real.length) return;
    const last = [...real].reverse().find((m) => m.fromUserId === contact.id);
    if (last) await markAsSeen(contact.id, new Date(last.createdAt).getTime());
  };

  const handleBurnChat = async () => {
    const res = await burnChat(contact.id);
    if (res?.success) {
      toast.success("Chat burned");
      push("/");
    }
  };

  const handleDeleteContact = async () => {
    const res = await deleteContact(contact.id);
    if (res.success) {
      toast.success("Contact removed");
      push("/");
    } else toast.error(res.error || "Failed to remove contact");
  };

  const styles = themeStyles[theme];
  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 lg:mr-8">
      <div
        className={`size-full relative rounded-md flex flex-col ${styles.chatBg}`}
      >
        <ChatHeader
          contact={contact}
          apiBase={apiBase}
          headerText={styles.headerText}
          theme={theme}
          onThemeChange={handleThemeChange}
          onBurnChat={handleBurnChat}
          onDeleteContact={handleDeleteContact}
          isEmpty={isEmpty}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-5 px-4 scroll-smooth pt-20"
        >
          {!isEmpty ? (
            <MessageList
              messages={messages}
              contact={contact}
              currentUser={currentUser}
              contactAvatar={contactAvatar}
              myAvatarUrl={myAvatarUrl}
              apiBase={apiBase}
              styles={styles}
            />
          ) : (
            <EmptyState contact={contact} styles={styles} />
          )}
        </div>

        <ChatInput
          inputValue={inputValue}
          setInputValue={setInputValue}
          isSending={isSending}
          isUploading={isUploading}
          isRecording={isRecording}
          recordingTime={recordingTime}
          isDark={isDark}
          emojiPickerOpen={emojiPickerOpen}
          setEmojiPickerOpen={setEmojiPickerOpen}
          styles={styles}
          onSendMessage={handleSendMessage}
          onFileUpload={handleFileUpload}
          startRecording={startRecording}
          stopRecording={stopRecording}
        />
      </div>
    </div>
  );
}

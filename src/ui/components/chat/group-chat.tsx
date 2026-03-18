"use client";

import { useWebSocket } from "@/context/WebSocketProvider";
import { getGroupChat, sendGroupMessage } from "@/lib/actions/groups/actions";
import { getPresignedUploadUrl } from "@/lib/actions/upload/presign";
import {
  GroupDetail,
  GroupMessage,
  SidebarContact,
  User,
} from "@/lib/definitions";
import ChatInput from "@/ui/components/chat/chat-input";
import { useTheme } from "next-themes";
import { startTransition, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import GroupChatHeader from "./group-chat-header";
import { GroupMessageList } from "./group-message-list";

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

export default function GroupChat({
  initialGroup,
  currentUser,
  contacts,
  onGroupRenamed,
}: {
  initialGroup: GroupDetail;
  currentUser: User;
  contacts: SidebarContact[];
  onGroupRenamed?: (groupId: string, name: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopRequestedRef = useRef(false);
  const mimeTypeRef = useRef<string>("");
  const recordingStartTimeRef = useRef<number>(0);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { addListener } = useWebSocket();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const [group, setGroup] = useState(initialGroup);

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const validThemes: Theme[] = ["default", "modern"];
    startTransition(() => {
      if (saved && validThemes.includes(saved)) setTheme(saved);
    });
  }, [group.id]);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  };

  useEffect(() => {
    async function loadMessages() {
      const response = await getGroupChat(group.id);
      if (response && "items" in response) {
        setMessages(response.items);
        setTimeout(() => scrollToBottom(), 100);
      } else if (response && "errors" in response) {
        toast.error("Failed to load messages");
      }
    }
    loadMessages();
  }, [group.id]);

  // Listen for real-time group messages
  useEffect(() => {
    const remove = addListener((payload) => {
      // Group messages come with groupId field
      if (!("groupId" in payload)) return;
      const msg = payload as unknown as GroupMessage;
      if (msg.groupId !== group.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollToBottom(), 50);
    });
    return remove;
  }, [group.id, addListener]);

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
      const result = await sendGroupMessage(group.id, inputValue);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setInputValue("");
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.id)) return prev;
          return [...prev, result];
        });
        setTimeout(() => scrollToBottom(), 50);
      }
    } finally {
      setIsSending(false);
    }
  };

  async function uploadToS3(file: File): Promise<{ key: string } | null> {
    try {
      let contentType = file.type || "application/octet-stream";
      if (!contentType.startsWith("audio/")) {
        contentType = contentType.split(";")[0];
      }
      const data = await getPresignedUploadUrl({
        folder: "uploads",
        contentType,
        contentLength: file.size,
      });
      if (data.error || !data.url) {
        toast.error(data.error || "Upload failed");
        return null;
      }
      const res = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
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
      const result = await sendGroupMessage(group.id, "", {
        attachmentKey: upload.key,
        attachmentType,
        attachmentName: file.name,
        attachmentSize: file.size,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setMessages((prev) => {
          if (prev.some((m) => m.id === result.id)) return prev;
          return [...prev, result];
        });
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

      recordingStartTimeRef.current = Date.now();

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/webm",
        "audio/ogg;codecs=opus",
      ];
      const mimeType =
        preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) ??
        null;

      if (!mimeType) {
        toast.error("Your browser does not support audio recording");
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      mimeTypeRef.current = mimeType;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const fullMimeType = mediaRecorder.mimeType;
        const audioBlob = new Blob(audioChunksRef.current, {
          type: fullMimeType,
        });
        if (audioBlob.size < 1000) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        let ext = "webm";
        if (fullMimeType.includes("mp4")) ext = "m4a";
        else if (fullMimeType.includes("ogg")) ext = "ogg";
        const file = new File([audioBlob], `voice-${Date.now()}.${ext}`, {
          type: fullMimeType,
        });
        const upload = await uploadToS3(file);
        if (upload) {
          const result = await sendGroupMessage(group.id, "", {
            attachmentKey: upload.key,
            attachmentType: "audio",
            attachmentName: file.name,
            attachmentSize: file.size,
          });
          if (!("error" in result)) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === result.id)) return prev;
              return [...prev, result];
            });
          }
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      toast.error("Microphone access denied or not available");
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

  const styles = themeStyles[theme];
  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 lg:mr-8">
      <div
        className={`size-full relative rounded-md flex flex-col ${styles.chatBg}`}
      >
        <GroupChatHeader
          contacts={contacts}
          group={group}
          apiBase={apiBase}
          headerText={styles.headerText}
          theme={theme}
          onThemeChange={handleThemeChange}
          currentUserId={currentUser.id}
          onGroupUpdated={setGroup}
          onGroupRenamed={onGroupRenamed}
        />

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto py-5 px-4 scroll-smooth pt-20"
        >
          {!isEmpty ? (
            <GroupMessageList
              messages={messages}
              group={group}
              currentUser={currentUser}
              apiBase={apiBase}
              styles={styles}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-gray-400 text-sm">
                No messages yet. Say hello!
              </p>
            </div>
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

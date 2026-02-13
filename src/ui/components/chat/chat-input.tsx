"use client";

import * as Popover from "@radix-ui/react-popover";
import { IconMoodSmile, IconPaperclip } from "@tabler/icons-react";
import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";
import { useRef } from "react";
import ButtonSend from "./button-send";

type ChatStyles = {
  inputBorder: string;
  inputBg: string;
  sent: string;
};

interface ChatInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  isSending: boolean;
  isUploading: boolean;
  isRecording: boolean;
  recordingTime: number;
  isDark: boolean;
  emojiPickerOpen: boolean;
  setEmojiPickerOpen: (open: boolean) => void;
  styles: ChatStyles;
  onSendMessage: () => void;
  onFileUpload: (ev: React.ChangeEvent<HTMLInputElement>) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

export default function ChatInput({
  inputValue,
  setInputValue,
  isSending,
  isUploading,
  isRecording,
  recordingTime,
  isDark,
  emojiPickerOpen,
  setEmojiPickerOpen,
  styles,
  onSendMessage,
  onFileUpload,
  startRecording,
  stopRecording,
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-3 p-4 w-full">
      <div
        className={`relative w-full pl-4 max-w-full pr-28 h-12 rounded-md border ${styles.inputBorder} ${styles.inputBg} flex items-center gap-2`}
      >
        {isRecording ? (
          <div className="flex items-center gap-2 w-full animate-pulse">
            <div
              className="size-2 rounded-full bg-red-500 select-none"
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            />
            <span
              className="text-sm font-medium text-red-500 select-none pointer-events-none"
              style={{
                WebkitUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
              }}
            >
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
              if (e.key === "Enter") onSendMessage();
            }}
          />
        )}

        <div className="absolute flex items-center gap-x-2 w-fit right-2 top-1">
          <label
            className={`hover:opacity-75 cursor-pointer p-2 ${isUploading && "opacity-50 pointer-events-none"}`}
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
              onChange={onFileUpload}
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
                  setInputValue(inputValue + emoji.emoji);
                  inputRef.current?.focus();
                }}
                theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                skinTonesDisabled
                style={
                  {
                    ...(isDark
                      ? {
                          "--epr-bg-color": "var(--color-zinc-900)",
                          "--epr-picker-border-color": "rgba(255,255,255,0.2)",
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
        handleSendMessage={onSendMessage}
        styles={styles}
      />
    </div>
  );
}

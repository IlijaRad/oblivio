"use client";

import useCancelOnOutsideTap from "@/lib/use-cancel-on-outside-tap";
import {
  IconMicrophone,
  IconPlayerStopFilled,
  IconSend,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ButtonSendProps {
  inputValue: string;
  isSending: boolean;
  isUploading: boolean;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  handleSendMessage: () => void;
  styles: {
    sent: string;
  };
}

const MIC_SOUND_PATH = "/mic-start.mp3";
const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export default function ButtonSend({
  inputValue,
  isSending,
  isUploading,
  isRecording,
  startRecording,
  stopRecording,
  handleSendMessage,
  styles,
}: ButtonSendProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isMicMode = !inputValue.trim();
  const buttonDisabled =
    isSending || isUploading || (!isMicMode && isRecording);
  const [isRecordingState, setIsRecordingState] = useState(false);

  const stopRecordingRef = useRef(stopRecording);
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  const startRecordingRef = useRef(startRecording);
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  const isRecordingRef = useRef(isRecording);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    setIsRecordingState(isRecording);
  }, [isRecording]);

  function playStartRecordingSound() {
    if (!isIOS) {
      const audio = new Audio(MIC_SOUND_PATH);
      audio.volume = 0.2;
      audio.play().catch(() => {});
    }
    if ("vibrate" in navigator) navigator.vibrate(100);
  }

  useEffect(() => {
    const btn = buttonRef.current;
    if (!btn || !isMicMode) return;

    const onPointerDown = (e: PointerEvent) => {
      if (buttonDisabled) return;
      e.preventDefault();

      if (e.pointerType === "touch") {
        btn.setPointerCapture(e.pointerId);
        playStartRecordingSound();
        startRecordingRef.current();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        e.preventDefault();
        stopRecordingRef.current();
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        stopRecordingRef.current();
      }
    };

    const onClickMic = (e: MouseEvent) => {
      if ((e as PointerEvent).pointerType === "touch") return;
      if (buttonDisabled) return;
      if (isRecordingRef.current) {
        stopRecordingRef.current();
      } else {
        playStartRecordingSound();
        startRecordingRef.current();
      }
    };

    btn.addEventListener("pointerdown", onPointerDown);
    btn.addEventListener("pointerup", onPointerUp);
    btn.addEventListener("pointercancel", onPointerCancel);
    btn.addEventListener("click", onClickMic);

    return () => {
      btn.removeEventListener("pointerdown", onPointerDown);
      btn.removeEventListener("pointerup", onPointerUp);
      btn.removeEventListener("pointercancel", onPointerCancel);
      btn.removeEventListener("click", onClickMic);
    };
  }, [isMicMode, buttonDisabled]);

  useCancelOnOutsideTap({
    isRecording,
    handleTouchEnd: stopRecording,
    buttonRef,
  });

  return (
    <motion.button
      ref={buttonRef}
      onClick={!isMicMode ? handleSendMessage : undefined}
      className={`size-12 shrink-0 rounded-md ${styles.sent} flex items-center justify-center hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:grayscale touch-none cursor-pointer relative overflow-hidden`}
      disabled={buttonDisabled}
      aria-label={inputValue.trim() ? "Send message" : "Record a voice message"}
      style={
        {
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitTouchCallout: "none",
        } as React.CSSProperties
      }
    >
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: isRecordingState ? 1 : 0 }}
        transition={{ duration: isRecordingState ? 0.18 : 0.25 }}
      />
      <motion.div
        className="relative z-10"
        initial={{ color: "#fff" }}
        animate={{ color: isRecordingState ? "#322218" : "#fff" }}
        transition={{ duration: isRecordingState ? 0.18 : 0.25 }}
      >
        {isSending || isUploading ? (
          <div className="size-5 border-2 border-current opacity-30 border-t-current animate-spin rounded-full" />
        ) : isRecording ? (
          <IconPlayerStopFilled size={22} />
        ) : inputValue.trim() ? (
          <IconSend size={22} />
        ) : (
          <IconMicrophone size={22} />
        )}
      </motion.div>
    </motion.button>
  );
}

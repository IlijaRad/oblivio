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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  function playStartRecordingSound() {
    if (!isIOS) {
      const audio = new Audio(MIC_SOUND_PATH);
      audio.volume = 0.2;
      audio.play();
      if ("vibrate" in navigator) {
        navigator.vibrate(100);
      }
    }
  }

  const handleTouchStart = () => {
    if (buttonDisabled) return;
    playStartRecordingSound();
    startRecording();
  };

  const handleTouchEnd = () => {
    if (isSending || isUploading) return;

    if ("vibrate" in navigator) {
      navigator.vibrate(100);
    }
    stopRecording();
  };

  const handleDesktopClick = () => {
    if (buttonDisabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      playStartRecordingSound();
      startRecording();
    }
  };

  useCancelOnOutsideTap({
    isRecording,
    handleTouchEnd,
    buttonRef,
  });

  useEffect(() => {
    setIsRecordingState(isRecording);
  }, [isRecording]);

  let handlers: {
    onClick?: () => void;
    onTouchStart?: () => void;
    onTouchEnd?: () => void;
    onTouchCancel?: () => void;
  } = {};

  if (isMicMode) {
    if (isMobile) {
      handlers = {
        onTouchStart: handleTouchStart,
        onTouchEnd: handleTouchEnd,
        onTouchCancel: handleTouchEnd,
      };
    } else {
      handlers = {
        onClick: handleDesktopClick,
      };
    }
  } else {
    handlers = { onClick: handleSendMessage };
  }

  return (
    <motion.button
      ref={buttonRef}
      className={`size-12 shrink-0 rounded-md ${styles.sent} flex items-center justify-center hover:brightness-110 transition-all shadow-md disabled:opacity-50 disabled:grayscale touch-none cursor-pointer relative overflow-hidden`}
      {...handlers}
      disabled={buttonDisabled}
      aria-label={inputValue.trim() ? "Send message" : "Record a voice message"}
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

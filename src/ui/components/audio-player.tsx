"use client";
import {
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import IconSoundwave from "../icons/icon-soundwave";
import IconButton from "./icon-button";

const audioManager = {
  current: null as HTMLAudioElement | null,
  currentStop: null as (() => void) | null,
  async play(audio: HTMLAudioElement, onStop: () => void): Promise<boolean> {
    if (this.current && this.current !== audio) {
      this.current.pause();
      this.current.currentTime = 0;
      this.currentStop?.();
    }
    this.current = audio;
    this.currentStop = onStop;
    try {
      await audio.play();
      return true;
    } catch (err) {
      this.current = null;
      this.currentStop = null;
      throw err;
    }
  },
  stop(audio: HTMLAudioElement) {
    if (this.current === audio) {
      this.current = null;
      this.currentStop = null;
    }
    audio.pause();
    audio.currentTime = 0;
  },
};

export default function AudioPlayer({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);
  const error = errorSrc === src;
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isLoadingRef = useRef(false);
  const stopLocal = () => setIsPlaying(false);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !src) {
      setErrorSrc(src);
      return;
    }

    if (isPlaying) {
      audioManager.stop(audio);
      setIsPlaying(false);
      return;
    }

    try {
      if (!loadedSrc) {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        await new Promise<void>((resolve, reject) => {
          const cleanup = () => {
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            isLoadingRef.current = false;
          };
          const onCanPlay = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            const mediaError = audio.error;
            console.error("Audio load failed:", {
              code: mediaError?.code,
              message: mediaError?.message,
            });
            cleanup();
            reject(new Error("load-failed"));
          };
          audio.addEventListener("canplay", onCanPlay);
          audio.addEventListener("error", onError);

          audio.src = src;
          audio.load();
          setLoadedSrc(src);
        });
      }

      await audioManager.play(audio, stopLocal);
      setIsPlaying(true);
    } catch (err: unknown) {
      setIsPlaying(false);
      if (err instanceof DOMException && err.name === "AbortError") return;
      setErrorSrc(src);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) audioManager.stop(audio);
    };
  }, []);

  return (
    <div className="flex items-center gap-3 min-w-50">
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          if (audioRef.current) audioManager.stop(audioRef.current);
        }}
        className="hidden"
      />
      <IconButton
        onClick={togglePlay}
        className={twMerge(
          "size-8",
          className,
          error && "opacity-40 cursor-not-allowed",
        )}
        disabled={error}
        title={error ? "Audio unavailable" : undefined}
      >
        {isPlaying ? <IconPlayerStopFilled /> : <IconPlayerPlayFilled />}
      </IconButton>
      <IconSoundwave />
    </div>
  );
}

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
  stop() {
    if (this.current) {
      this.current.pause();
      this.current.currentTime = 0;
      this.current = null;
    }
  },
  register(audio: HTMLAudioElement) {
    if (this.current && this.current !== audio) {
      this.current.pause();
      this.current.currentTime = 0;
    }
    this.current = audio;
  },
  unregister(audio: HTMLAudioElement) {
    if (this.current === audio) this.current = null;
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
  const [error, setError] = useState(false);
  const loadedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audioManager.unregister(audio);
      setIsPlaying(false);
      return;
    }

    if (!loadedRef.current) {
      audio.src = src;
      audio.load();
      loadedRef.current = true;
    }

    audioManager.register(audio);

    window.dispatchEvent(
      new CustomEvent("audioplayer:play", { detail: { src } }),
    );

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((err) => {
        audioManager.unregister(audio);
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(true);
      });
  };

  useEffect(() => {
    const onOtherPlay = (e: Event) => {
      const detail = (e as CustomEvent<{ src: string }>).detail;
      if (detail.src !== src && isPlaying) {
        setIsPlaying(false);
      }
    };
    window.addEventListener("audioplayer:play", onOtherPlay);
    return () => window.removeEventListener("audioplayer:play", onOtherPlay);
  }, [src, isPlaying]);

  return (
    <div className="flex items-center gap-3 min-w-50">
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => {
          const audio = audioRef.current;
          if (audio) audioManager.unregister(audio);
          setIsPlaying(false);
        }}
        onError={() => {
          if (loadedRef.current) setError(true);
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

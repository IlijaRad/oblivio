"use client";

import {
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import IconSoundwave from "../icons/icon-soundwave";
import IconButton from "./icon-button";

export default function AudioPlayer({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause();
    else audioRef.current?.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 min-w-50">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <IconButton onClick={togglePlay} className={twMerge("size-8", className)}>
        {isPlaying ? <IconPlayerStopFilled /> : <IconPlayerPlayFilled />}
      </IconButton>
      <IconSoundwave />
    </div>
  );
}

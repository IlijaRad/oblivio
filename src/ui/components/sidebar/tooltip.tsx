"use client";

import IconCopy from "@/ui/icons/icon-copy";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";

export default function ClickTooltip({
  onClick,
}: {
  onClick: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await onClick();

    if (timerRef.current) clearTimeout(timerRef.current);

    setOpen(true);
    timerRef.current = setTimeout(() => {
      setOpen(false);
    }, 2000);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 cursor-pointer outline-none hover:opacity-80 transition-opacity"
        aria-label="Copy invite link"
      >
        <IconCopy />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={5}
          align="center"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => {
            if ((e.target as HTMLElement).closest("button")) e.preventDefault();
          }}
          className="bg-zinc-800 text-white text-[12px] px-2 py-1 rounded shadow-md z-100 animate-in fade-in zoom-in-95 duration-150"
        >
          Copied!
          <Popover.Arrow className="fill-zinc-800" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

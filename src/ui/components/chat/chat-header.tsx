"use client";

import { calls } from "@/lib/calls";
import { SelectedContact } from "@/lib/definitions";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconArrowLeft, IconDotsVertical, IconX } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import IconCamera from "../../icons/icon-camera";
import IconPhone from "../../icons/icon-phone";
import IconButton from "../icon-button";
import BurnButton from "./burn-button";
import ConfirmDialog from "./confirm-dialog";

type Theme = "default" | "modern";

interface ChatHeaderProps {
  contact: SelectedContact;
  apiBase?: string;
  headerText: string;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onBurnChat: () => void;
  onDeleteContact: () => void;
  isEmpty: boolean;
}

export default function ChatHeader({
  contact,
  apiBase,
  headerText,
  theme,
  onThemeChange,
  onBurnChat,
  onDeleteContact,
  isEmpty,
}: ChatHeaderProps) {
  const [burnOpen, setBurnOpen] = useState(false);
  const [unfriendOpen, setUnfriendOpen] = useState(false);

  const contactAvatar = contact.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(contact.avatarKey)}`
    : null;

  return (
    <>
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
              <span className={`text-lg font-medium ${headerText}`}>
                {contact.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col truncate">
            <span className={`font-medium truncate ${headerText}`}>
              {contact.username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            className="size-9 bg-green-500/90 hover:bg-green-600"
            onClick={async () => {
              try {
                await calls.startCall(contact.id, false);
              } catch {
                toast.error("Call failed");
              }
            }}
            aria-label="Start voice call"
          >
            <IconPhone className="text-white" />
          </IconButton>
          <IconButton
            className="size-9 bg-blue-500/90 hover:bg-blue-600"
            onClick={async () => {
              try {
                await calls.startCall(contact.id, true);
              } catch {
                toast.error("Video call failed");
              }
            }}
            aria-label="Start video call"
          >
            <IconCamera className="text-white" />
          </IconButton>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <IconButton className="size-9 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                <IconDotsVertical size={20} className={headerText} />
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
                    onClick={() => onThemeChange(t)}
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
                  onClick={() => setUnfriendOpen(true)}
                  className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer outline-none"
                >
                  Remove Contact
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <Link
            className="hidden lg:flex size-9 rounded-md hover:bg-black/5 items-center justify-center"
            href="/"
          >
            <IconX size={20} className={headerText} />
          </Link>
        </div>
      </div>

      {!isEmpty && (
        <div className="w-full absolute inset-x-0 top-19.25 bg-transparent h-10 z-10">
          <BurnButton onClick={() => setBurnOpen(true)}></BurnButton>
        </div>
      )}

      <ConfirmDialog
        open={burnOpen}
        onOpenChange={setBurnOpen}
        title="Burn this chat?"
        description={`This will permanently delete all messages with ${contact.username}. This action cannot be undone.`}
        confirmLabel="Burn Chat"
        onConfirm={() => {
          setBurnOpen(false);
          onBurnChat();
        }}
      />
      <ConfirmDialog
        open={unfriendOpen}
        onOpenChange={setUnfriendOpen}
        title={`Remove ${contact.username}?`}
        description="They will be removed from your contacts. You won't be able to message them unless you add them again."
        confirmLabel="Remove Contact"
        onConfirm={() => {
          setUnfriendOpen(false);
          onDeleteContact();
        }}
      />
    </>
  );
}

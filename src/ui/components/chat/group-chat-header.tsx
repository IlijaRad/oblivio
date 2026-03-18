"use client";

import { GroupDetail, SidebarContact } from "@/lib/definitions";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  IconArrowLeft,
  IconDotsVertical,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import IconCamera from "../../icons/icon-camera";
import IconPhone from "../../icons/icon-phone";
import IconButton from "../icon-button";
import GroupSettingsDialog from "./group-settings-dialog";

type Theme = "default" | "modern";

interface GroupChatHeaderProps {
  group: GroupDetail;
  apiBase?: string;
  headerText: string;
  currentUserId: string;
  contacts: SidebarContact[];
  onGroupUpdated?: (group: GroupDetail) => void;
  onGroupRenamed?: (groupId: string, name: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function GroupChatHeader({
  group,
  apiBase,
  headerText,
  currentUserId,
  contacts,
  onGroupUpdated,
  onGroupRenamed,
  theme,
  onThemeChange,
}: GroupChatHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const avatarUrl = group.avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(group.avatarKey)}`
    : null;

  const displayName =
    group.name ||
    group.members
      .slice(0, 3)
      .map((m) => m.username)
      .join(", ");

  const memberCount = group.members.length;

  return (
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
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <IconUsers size={18} className="text-gray-400" />
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span
            className={`font-medium dark:text-white text-gray-900 truncate ${headerText}`}
          >
            {displayName}
          </span>
          <span className="text-xs text-gray-400">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <IconButton
          className="size-9 bg-green-500/90 hover:bg-green-600"
          aria-label="Start voice call"
        >
          <IconPhone className="text-white" />
        </IconButton>
        <IconButton
          className="size-9 bg-blue-500/90 hover:bg-blue-600"
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
                  {theme === t && <span className="text-xs opacity-70">✓</span>}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Separator className="my-1.5 h-px bg-black/10 dark:bg-white/10 mx-1" />
              <DropdownMenu.Item
                onSelect={() => setSettingsOpen(true)}
                className={`px-3 py-2 text-sm rounded-lg cursor-pointer outline-none transition-colors flex items-center justify-between `}
                title="Group Settings"
              >
                Settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <GroupSettingsDialog
          group={group}
          currentUserId={currentUserId}
          contacts={contacts}
          apiBase={apiBase}
          onGroupUpdated={onGroupUpdated}
          onGroupRenamed={onGroupRenamed}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />

        <Link
          className="hidden lg:flex size-9 rounded-md hover:bg-black/5 items-center justify-center"
          href="/"
        >
          <IconX size={20} className={headerText} />
        </Link>
      </div>
    </div>
  );
}

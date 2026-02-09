"use client";

import IconCaretDown from "@/ui/icons/icon-caret-down";
import IconUser from "@/ui/icons/icon-user";
import IconUserCount from "@/ui/icons/icon-user-count";
import LogoHeader from "@/ui/icons/logo-header";
import * as Popover from "@radix-ui/react-popover";
import { IconSettings } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";
import { ContactRequestsDialog } from "../contact-requests-dialog";
import ThemeSwitcher from "../theme-switcher";
import LogoutButton from "./logout-button";

interface HeaderProps {
  requestCount?: number;
  user: {
    username: string;
    avatarKey: string | null;
  };
}

export function Header({ requestCount = 0, user }: HeaderProps) {
  const pathname = usePathname();

  const avatarUrl = user.avatarKey
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/view?key=${encodeURIComponent(user.avatarKey)}`
    : null;

  return (
    <header
      className={twMerge(
        "w-full px-4 sm:px-6 lg:px-8 py-4",
        pathname === "/" ? "block" : "hidden lg:block",
      )}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <LogoHeader />

        <div className="flex items-center gap-2.5 md:gap-4 flex-wrap">
          <ThemeSwitcher />

          <ContactRequestsDialog>
            <button
              className="h-11.25 cursor-pointer w-15 flex items-center justify-center p-px bg-[linear-gradient(75deg,#944C16,10%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
              aria-label="Notifications"
            >
              <div className="size-full gap-0 relative rounded-[calc(var(--radius-md)-1px)] dark:bg-[#1E1E1E] bg-[#F1F1F1] flex items-center justify-center">
                <IconUserCount />
                <span className="font-medium dark:text-white text-gray-900">
                  {requestCount}
                </span>
                {requestCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
            </button>
          </ContactRequestsDialog>

          <Popover.Root>
            <Popover.Trigger
              className="h-11.25 group cursor-pointer w-15 flex items-center justify-center p-px bg-[linear-gradient(75deg,#944C16,10%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
              aria-label="User menu"
            >
              <div className="size-full gap-0 relative rounded-[calc(var(--radius-md)-1px)] dark:bg-[#1E1E1E] bg-[#F1F1F1] flex items-center justify-center">
                <IconUser />
                <IconCaretDown className="text-[#1e1e1e] dark:text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </Popover.Trigger>

            <Popover.Portal>
              <Popover.Content
                sideOffset={10}
                align="end"
                className="w-72 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 outline-none"
              >
                <div className="mx-4 py-4 flex items-center gap-3 border-b border-black/5 dark:border-white/5">
                  <div className="size-10 shrink-0 relative rounded-md overflow-hidden border-2 border-[#944C16] bg-zinc-100 dark:bg-zinc-800">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={user.username}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-lg font-bold text-zinc-900 dark:text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className=" text-zinc-900 dark:text-white truncate">
                      {user.username}
                    </span>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <Popover.Close asChild>
                    <Link
                      href="/profile"
                      className="flex items-center border border-black/20 gap-3 w-full px-3 py-2.5 rounded-md text-sm dark:border-white/20 dark:bg-transparent text-zinc-900 dark:text-zinc-100"
                    >
                      <IconSettings
                        size={18}
                        className="text-zinc-500 dark:text-zinc-400"
                      />
                      Profile settings
                    </Link>
                  </Popover.Close>
                  <LogoutButton />
                </div>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
    </header>
  );
}

"use client";

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
      <div className="flex items-center justify-between">
        <LogoHeader />

        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />

          <ContactRequestsDialog>
            <button
              className="h-11.25 cursor-pointer w-15 flex items-center justify-center p-px bg-[linear-gradient(75deg,#944C16,10%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
              aria-label="Notifications"
            >
              <div className="size-full gap-0 relative rounded-[calc(var(--radius-md)-1px)] dark:bg-[#1E1E1E] bg-[#F1F1F1] flex items-center justify-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.80002 10.725C11.0791 10.725 12.925 8.87906 12.925 6.6C12.925 4.32094 11.0791 2.475 8.80002 2.475C6.52096 2.475 4.67502 4.32094 4.67502 6.6C4.67502 8.87906 6.52096 10.725 8.80002 10.725ZM7.77909 12.65C4.39315 12.65 1.65002 15.3931 1.65002 18.7791C1.65002 19.3428 2.10721 19.8 2.67096 19.8H10.5875C9.80721 18.7172 9.35002 17.3869 9.35002 15.95C9.35002 14.7537 9.66971 13.6297 10.2266 12.6637C10.0925 12.6534 9.95846 12.65 9.82096 12.65H7.77909ZM15.95 20.9C18.6828 20.9 20.9 18.6828 20.9 15.95C20.9 13.2172 18.6828 11 15.95 11C13.2172 11 11 13.2172 11 15.95C11 18.6828 13.2172 20.9 15.95 20.9ZM16.5 13.75V15.4H18.15C18.4525 15.4 18.7 15.6475 18.7 15.95C18.7 16.2525 18.4525 16.5 18.15 16.5H16.5V18.15C16.5 18.4525 16.2525 18.7 15.95 18.7C15.6475 18.7 15.4 18.4525 15.4 18.15V16.5H13.75C13.4475 16.5 13.2 16.2525 13.2 15.95C13.2 15.6475 13.4475 15.4 13.75 15.4H15.4V13.75C15.4 13.4475 15.6475 13.2 15.95 13.2C16.2525 13.2 16.5 13.4475 16.5 13.75Z"
                    fill="url(#paint0_linear_notification)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_notification"
                      x1="1.65002"
                      y1="20.9"
                      x2="9.7711"
                      y2="20.5876"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop className="[stop-color:#944c16] dark:[stop-color:#fff]" />
                      <stop
                        className="[stop-color:#0D0D0F] dark:[stop-color:#fff]"
                        offset="1"
                      />
                    </linearGradient>
                  </defs>
                </svg>
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
              className="h-11.25 cursor-pointer w-15 flex items-center justify-center p-px bg-[linear-gradient(75deg,#944C16,10%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
              aria-label="User menu"
            >
              <div className="size-full gap-0 relative rounded-[calc(var(--radius-md)-1px)] dark:bg-[#1E1E1E] bg-[#F1F1F1] flex items-center justify-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 10.725C13.279 10.725 15.125 8.87906 15.125 6.6C15.125 4.32094 13.279 2.475 11 2.475C8.72091 2.475 6.87498 4.32094 6.87498 6.6C6.87498 8.87906 8.72091 10.725 11 10.725ZM9.97904 12.65C6.5931 12.65 3.84998 15.3931 3.84998 18.7791C3.84998 19.3428 4.30716 19.8 4.87091 19.8H17.129C17.6928 19.8 18.15 19.3428 18.15 18.7791C18.15 15.3931 15.4068 12.65 12.0209 12.65H9.97904Z"
                    fill="url(#paint0_linear_user)"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_user"
                      x1="3.84998"
                      y1="19.8"
                      x2="9.88612"
                      y2="19.6165"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop className="[stop-color:#944c16] dark:[stop-color:#fff]" />
                      <stop
                        offset="1"
                        className="[stop-color:#0D0D0F] dark:[stop-color:#fff]"
                      />
                    </linearGradient>
                  </defs>
                </svg>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#1e1e1e] dark:text-white"
                >
                  <path
                    d="M7.97672 11.7087C8.31141 11.9797 8.80282 11.9611 9.1136 11.6503L12.5136 8.25031C12.758 8.00594 12.8297 7.64203 12.6969 7.32328C12.5641 7.00453 12.2559 6.8 11.9133 6.8H5.11328C4.77063 6.8 4.45985 7.00719 4.32703 7.32594C4.19422 7.64469 4.2686 8.00859 4.51297 8.25031L7.91297 11.6503L7.97672 11.7087Z"
                    fill="currentColor"
                  />
                </svg>
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

"use client";

import IconCaretDown from "@/ui/icons/icon-caret-down";
import IconUser from "@/ui/icons/icon-user";
import IconUserCount from "@/ui/icons/icon-user-count";
import LogoHeader from "@/ui/icons/logo-header";
import * as Popover from "@radix-ui/react-popover";
import { IconSettings } from "@tabler/icons-react";
import { useTheme } from "next-themes";
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
  const { resolvedTheme, setTheme } = useTheme();

  const avatarUrl = user.avatarKey
    ? `${process.env.NEXT_PUBLIC_API_URL}/uploads/view?key=${encodeURIComponent(user.avatarKey)}`
    : null;

  const isDark = resolvedTheme === "dark";

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={twMerge(
        "w-full px-4 sm:px-6 lg:px-8 py-4",
        pathname === "/" || pathname === "/profile"
          ? "block"
          : "hidden lg:block",
      )}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <LogoHeader />

        <div className="flex items-center gap-2.5 md:gap-4 flex-wrap">
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>

          <ContactRequestsDialog>
            <button
              className="h-11.25 cursor-pointer w-15 flex items-center justify-center p-px border-0 bg-[linear-gradient(75deg,#944C16,50%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
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
              className="h-11.25 group cursor-pointer w-15 flex items-center justify-center border-0 p-px bg-[linear-gradient(75deg,#944C16,50%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] relative rounded-md"
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
                  <Popover.Close
                    onClick={toggleDarkMode}
                    className="flex md:hidden items-center border border-black/20 gap-3 w-full px-3 py-2.5 rounded-md text-sm dark:border-white/20 dark:bg-transparent text-zinc-900 dark:text-zinc-100"
                  >
                    {isDark ? (
                      <>
                        {" "}
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 22 22"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.175 18.9742C10.175 19.4314 10.5428 19.7992 11 19.7992C11.4572 19.7992 11.825 19.4314 11.825 18.9742V17.0492C11.825 16.592 11.4572 16.2242 11 16.2242C10.5428 16.2242 10.175 16.592 10.175 17.0492V18.9742ZM10.175 4.94922C10.175 5.40641 10.5428 5.77422 11 5.77422C11.4572 5.77422 11.825 5.40641 11.825 4.94922V3.02422C11.825 2.56703 11.4572 2.19922 11 2.19922C10.5428 2.19922 10.175 2.56703 10.175 3.02422V4.94922ZM4.77814 4.77734C4.45501 5.10047 4.45501 5.62297 4.77814 5.94266L6.13939 7.30391C6.46251 7.62703 6.98501 7.62703 7.3047 7.30391C7.62439 6.98078 7.62782 6.45828 7.3047 6.13859L5.94345 4.77734C5.62032 4.45422 5.09782 4.45422 4.77814 4.77734ZM14.6953 14.6945C14.3722 15.0177 14.3722 15.5402 14.6953 15.8598L16.0566 17.2211C16.3797 17.5442 16.9022 17.5442 17.2219 17.2211C17.5416 16.898 17.545 16.3755 17.2219 16.0558L15.8606 14.6945C15.5375 14.3714 15.015 14.3714 14.6953 14.6945ZM2.20001 10.9992C2.20001 11.4564 2.56782 11.8242 3.02501 11.8242H4.95001C5.4072 11.8242 5.77501 11.4564 5.77501 10.9992C5.77501 10.542 5.4072 10.1742 4.95001 10.1742H3.02501C2.56782 10.1742 2.20001 10.542 2.20001 10.9992ZM16.225 10.9992C16.225 11.4564 16.5928 11.8242 17.05 11.8242H18.975C19.4322 11.8242 19.8 11.4564 19.8 10.9992C19.8 10.542 19.4322 10.1742 18.975 10.1742H17.05C16.5928 10.1742 16.225 10.542 16.225 10.9992ZM4.77814 17.2211C5.10126 17.5442 5.62376 17.5442 5.94345 17.2211L7.3047 15.8598C7.62782 15.5367 7.62782 15.0142 7.3047 14.6945C6.98158 14.3748 6.45907 14.3714 6.13939 14.6945L4.77814 16.0558C4.45501 16.3789 4.45501 16.9014 4.77814 17.2211ZM14.6953 7.30391C15.0184 7.62703 15.5409 7.62703 15.8606 7.30391L17.2219 5.94266C17.545 5.61953 17.545 5.09703 17.2219 4.77734C16.8988 4.45766 16.3763 4.45422 16.0566 4.77734L14.6953 6.13859C14.3722 6.46172 14.3722 6.98422 14.6953 7.30391ZM11 14.8492C13.1278 14.8492 14.85 13.127 14.85 10.9992C14.85 8.87141 13.1278 7.14922 11 7.14922C8.8722 7.14922 7.15001 8.87141 7.15001 10.9992C7.15001 13.127 8.8722 14.8492 11 14.8492Z"
                            fill="white"
                          />
                        </svg>
                        Light mode
                      </>
                    ) : (
                      <>
                        {" "}
                        <svg
                          width="16"
                          height="18"
                          viewBox="0 0 16 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.8 0C3.93938 0 0 3.93938 0 8.8C0 13.6606 3.93938 17.6 8.8 17.6C11.165 17.6 13.3134 16.665 14.8947 15.1456C15.1456 14.905 15.2178 14.5303 15.0769 14.2141C14.9359 13.8978 14.6059 13.7019 14.2587 13.7294C14.0903 13.7431 13.9219 13.75 13.75 13.75C10.2575 13.75 7.425 10.9175 7.425 7.425C7.425 4.94656 8.85156 2.79813 10.9347 1.76C11.2475 1.60531 11.4263 1.26844 11.385 0.92125C11.3438 0.574063 11.0894 0.292188 10.7491 0.216563C10.12 0.0756251 9.46688 0 8.8 0Z"
                            fill="url(#paint0_linear_33_42)"
                          />
                          <defs>
                            <linearGradient
                              id="paint0_linear_33_42"
                              x1="0"
                              y1="17.6"
                              x2="6.39361"
                              y2="17.3974"
                              gradientUnits="userSpaceOnUse"
                            >
                              <stop stopColor="#944C16" />
                              <stop offset="1" stopColor="#0D0D0F" />
                            </linearGradient>
                          </defs>
                        </svg>
                        Dark mode
                      </>
                    )}
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

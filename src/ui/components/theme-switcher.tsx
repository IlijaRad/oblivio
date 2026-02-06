"use client";

import { useTheme } from "next-themes";
import { twMerge } from "tailwind-merge";
import IconMoon from "../icons/icon-moon";
import IconSun from "../icons/icon-sun";

export default function ThemeSwitcher({
  className = "",
}: {
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const toggleDarkMode = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={twMerge(
        "h-11.5 w-12 p-px bg-[linear-gradient(75deg,#944C16,10%,#0D0D0F)] dark:bg-[linear-gradient(75deg,#944C16,30%,#fff)] flex items-center justify-center rounded-md relative cursor-pointer",
        className,
      )}
      aria-label="Toggle dark mode"
    >
      <div className="w-full h-full dark:bg-[#1E1E1E] bg-[#F1F1F1] flex items-center justify-center rounded-[calc(var(--radius-md)-1px)]">
        {isDark ? <IconSun /> : <IconMoon />}
      </div>
    </button>
  );
}

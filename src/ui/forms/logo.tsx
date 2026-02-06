"use client";

import { useTheme } from "next-themes";
import Image from "next/image";

export default function Logo() {
  const { resolvedTheme } = useTheme();

  if (!resolvedTheme) return null;

  return (
    <Image
      src={resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png"}
      alt=""
      width={228}
      height={50}
      className="mx-auto"
    />
  );
}

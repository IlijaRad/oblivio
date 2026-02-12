"use client";

import { logout } from "@/lib/actions/auth/logout";
import { IconLogout } from "@tabler/icons-react";
import { ComponentProps } from "react";

export default function LogoutButton(props: ComponentProps<"button">) {
  return (
    <button
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-white dark:bg-red-400 bg-red-600 dark:text-gray-900 cursor-pointer"
      {...props}
      onClick={logout}
    >
      <IconLogout size={18} />
      Logout
    </button>
  );
}

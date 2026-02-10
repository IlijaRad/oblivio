"use client";

import { logout } from "@/lib/actions/auth/logout";
import { IconLogout } from "@tabler/icons-react";

export default function LogoutButton() {
  return (
    <button
      onClick={logout}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-white dark:bg-red-400 bg-red-600 dark:text-gray-900 cursor-pointer"
    >
      <IconLogout size={18} />
      Logout
    </button>
  );
}

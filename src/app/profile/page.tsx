import { getUser } from "@/lib/actions/auth/get-user";
import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { AvatarUploader } from "@/ui/components/avatar-uploader";
import { ChangePasswordDialog } from "@/ui/components/change-password-dialog";
import { HeaderClient } from "@/ui/components/header/header-client";
import { VisibilityToggle } from "@/ui/components/visibility-toggle";
import { IconX } from "@tabler/icons-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientLayout } from "../(chat)/client-layout";

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value;

  const [user, friendRequests, contactsList] = await Promise.all([
    getUser(),
    getFullFriendRequests(),
    getContacts(),
  ]);

  if (user && "unauthorized" in user) {
    redirect("/api/auth/logout");
  }
  if (!user || "errors" in user) {
    redirect("/api/auth/logout");
  }
  if (friendRequests && "unauthorized" in friendRequests) {
    redirect("/api/auth/logout");
  }

  const count = Array.isArray(friendRequests) ? friendRequests.length : 0;

  const contacts = Array.isArray(contactsList)
    ? contactsList.map((c) => ({ id: c.id, username: c.username }))
    : [];

  return (
    <ClientLayout userId={user.id} token={token} contacts={contacts}>
      <HeaderClient user={user} initialRequestCount={count} />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-md mb-4 dark:bg-zinc-900 min-h-[calc(100dvh-94px)]">
          <div className=" mx-auto px-5 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between mb-8 md:mb-10 pb-6 border-b border-b-black/20 dark:border-b-white/20">
              <h1 className="text-xl md:text-[20px] font-normal text-brand-text">
                My Profile
              </h1>
              <Link
                href="/"
                className="w-9 h-9 md:w-8.75 md:h-8.25 text-[#1e1e1e] dark:text-white rounded-[5px] border flex items-center justify-center"
                aria-label="Close"
              >
                <IconX />
              </Link>
            </div>
            <div className="h-px mb-8 md:mb-12" aria-hidden />
            <div className="flex flex-col items-center mb-12 md:mb-16">
              <AvatarUploader
                initialAvatarKey={user.avatarKey}
                username={user.username}
              />
            </div>
            <div className="max-w-155 mx-auto space-y-4 md:space-y-4">
              <div className="h-px bg-black/20 dark:bg-white/20" aria-hidden />
              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">
                  Visible in search
                </span>
                <VisibilityToggle initialValue={user.isSearchable} />
              </div>
              <div className="h-px bg-black/20 dark:bg-white/20" aria-hidden />
              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">Username</span>
              </div>
              <div className="h-px bg-black/20 dark:bg-white/20" aria-hidden />
              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">Password</span>
                <ChangePasswordDialog />
              </div>
              <div className="h-px bg-black/20 dark:bg-white/20" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
}

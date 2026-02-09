import { getUser } from "@/lib/actions/auth/get-user";
import { AvatarUploader } from "@/ui/components/avatar-uploader";
import { ChangePasswordDialog } from "@/ui/components/change-password-dialog";
import Wrapper from "@/ui/components/header/wrapper";
import { VisibilityToggle } from "@/ui/components/visibility-toggle";
import { IconX } from "@tabler/icons-react";
import Link from "next/link";

export default async function Page() {
  const user = await getUser();

  if ((user && "errors" in user) || !user) return null;

  return (
    <div>
      <Wrapper />
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen bg-white dark:bg-zinc-900">
          <div className=" mx-auto px-5 py-6 md:px-8 md:py-8">
            <div className="flex items-center justify-between mb-8 md:mb-10 pb-6 border-b border-b-black/20 dark:border-b-white">
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
              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">
                  Visible in search
                </span>

                <VisibilityToggle initialValue={user.isSearchable} />
              </div>
              <div className="h-px bg-black/20 dark:bg-white" aria-hidden />

              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">Username</span>
                <button className="text-base font-semibold bg-gradient-brand bg-clip-text text-transparent underline hover:opacity-80 transition-opacity">
                  Change
                </button>
              </div>
              <div className="h-px bg-black/20 dark:bg-white" aria-hidden />

              <div className="flex items-center justify-between">
                <span className="text-gray-950 dark:text-white">Password</span>
                <ChangePasswordDialog />
              </div>

              <div className="h-px bg-black/20 dark:bg-white" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

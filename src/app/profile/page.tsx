import { getUser } from "@/lib/actions/auth/get-user";
import { AvatarUploader } from "@/ui/components/avatar-uploader";
import { ChangePasswordDialog } from "@/ui/components/change-password-dialog";
import Wrapper from "@/ui/components/header/wrapper";
import { VisibilityToggle } from "@/ui/components/visibility-toggle";
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
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 23 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.58012 4.93781C6.1309 4.48859 5.40137 4.48859 4.95215 4.93781C4.50293 5.38703 4.50293 6.11656 4.95215 6.56578L9.88996 11.5L4.95574 16.4378C4.50652 16.887 4.50652 17.6166 4.95574 18.0658C5.40496 18.5150 6.13449 18.5150 6.58371 18.0658L11.5179 13.128L16.4557 18.0622C16.905 18.5114 17.6345 18.5114 18.0837 18.0622C18.5329 17.613 18.5329 16.8834 18.0837 16.4342L13.1459 11.5L18.0801 6.56219C18.5293 6.11297 18.5293 5.38344 18.0801 4.93422C17.6309 4.485 16.9014 4.485 16.4521 4.93422L11.5179 9.87203L6.58012 4.93781Z"
                    fill="currentColor"
                  />
                </svg>
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

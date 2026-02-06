"use client";

import { changePassword } from "@/lib/actions/auth/change-password";
import * as Dialog from "@radix-ui/react-dialog";
import { IconX } from "@tabler/icons-react";
import { useActionState } from "react";
import Input from "./input";
import Label from "./label";

export function ChangePasswordDialog() {
  const [state, formAction, isPending] = useActionState(changePassword, null);

  return (
    <Dialog.Root>
      <Dialog.Trigger className="text-base font-semibold bg-gradient-brand bg-clip-text  underline hover:opacity-80 transition-opacity">
        Change
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-50 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-medium dark:text-white">
              Change Password
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white cursor-pointer transition-colors"
                aria-label="Close"
              >
                <IconX />
              </button>
            </Dialog.Close>
          </div>

          <div className="h-px w-full bg-black/20 mb-6" aria-hidden />

          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="oldPassword">Old Password</Label>
              <Input
                id="oldPassword"
                name="oldPassword"
                type="password"
                required
                className="mt-1"
                placeholder="Type here..."
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                className="mt-1"
                placeholder="Type here..."
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1"
                placeholder="Type here..."
              />
            </div>

            {state?.errors?.server && (
              <p className="text-sm text-red-500 ">{state.errors.server[0]}</p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-6 h-11 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md disabled:opacity-50"
            >
              {isPending ? "Updating..." : "Apply changes"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

"use client";

import { generateInviteLink } from "@/lib/actions/friends/generate-invite-link";
import * as Dialog from "@radix-ui/react-dialog";
import { IconPlus, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import IconButton from "../icon-button";
import ClickTooltip from "./tooltip";

const transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
} as const;

export default function AddContactModal() {
  const [token, setToken] = useState("");
  const [showInviteArea, setShowInviteArea] = useState(false);

  const shareLink =
    typeof window !== "undefined" && token
      ? `${window.location.origin}/invite/${token}`
      : "";

  async function getInviteLink() {
    setShowInviteArea(true);
    setToken("");

    const res = await generateInviteLink();
    if (res && "token" in res) {
      setToken(res.token);
    } else {
      toast.error("Failed to generate link");
      setShowInviteArea(false);
    }
  }

  async function copyInvite() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {}
  }

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          setToken("");
          setShowInviteArea(false);
        }
      }}
    >
      <Dialog.Trigger
        className="w-8.75 h-8.25 rounded-md border border-black/60 flex items-center justify-center hover:bg-opacity-80 transition-colors"
        aria-label="Add contact"
      >
        <IconPlus size={20} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=closed]:animate-overlayExit data-[state=open]:animate-overlayShow bg-black/80 fixed inset-0 z-50 cursor-pointer" />

        <Dialog.Content asChild>
          <motion.div
            layout
            transition={transition}
            style={{ borderRadius: 12 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] md:w-full md:max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-2xl dark:bg-zinc-900 outline-none overflow-hidden"
          >
            <Dialog.Title className="hidden">Add contact</Dialog.Title>

            <motion.div layout="position" transition={transition}>
              <div className="flex pb-4 border-b border-b-black/20 dark:border-b-white justify-between items-center">
                <span className="text-xl text-gray-900 dark:text-white">
                  Add new contact
                </span>
                <Dialog.Close asChild>
                  <IconButton
                    className="border-0 -mr-2 text-zinc-900 dark:text-white"
                    aria-label="Close dialog"
                  >
                    <IconX />
                  </IconButton>
                </Dialog.Close>
              </div>

              <div className="mt-4">
                If you can’t find your friend via search, You can send an invite
                link.
              </div>

              <button
                onClick={getInviteLink}
                className="text-medium mt-4 h-11 w-full bg-linear-to-r from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] cursor-pointer rounded-md dark:to-white dark:via-none dark:text-gray-950 bg-gray-900 px-3.5 text-white"
              >
                Generate invite link
              </button>
            </motion.div>

            <AnimatePresence initial={false}>
              {showInviteArea && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition}
                >
                  <div className="mt-5 w-full h-px bg-[#BABABA]" />

                  <motion.div layout="position" transition={transition}>
                    <div className="relative">
                      <input
                        readOnly
                        value={token ? shareLink : "Generating..."}
                        className={`block font-medium pl-3 pr-10 mt-5 h-9.5 dark:border-white border-black/20 w-full rounded-md border text-ellipsis transition-colors ${
                          !token
                            ? "text-gray-400 animate-pulse"
                            : "text-zinc-900 dark:text-white"
                        }`}
                      />
                      {token && <ClickTooltip onClick={copyInvite} />}
                    </div>
                    <button
                      disabled={!token}
                      className="w-full cursor-pointer h-11 px-6 mt-9 rounded-md font-medium border border-[rgba(148,76,22,1)] flex items-center gap-x-2 justify-center text-[rgba(148,76,22,1)] dark:text-white dark:border-white disabled:opacity-50"
                    >
                      Share invite link
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

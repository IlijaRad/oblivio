"use client";

import {
  getFullFriendRequests,
  respondToFriendRequest,
} from "@/lib/actions/friends/get-requests";
import { FriendRequest } from "@/lib/definitions";
import * as Dialog from "@radix-ui/react-dialog";
import { IconCheck, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import IconButton from "./icon-button";

export function ContactRequestsDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isPending, startTransition] = useTransition();
  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const fetchRequests = async () => {
    const data = await getFullFriendRequests();
    setRequests(data);
  };

  const handleResponse = (id: string, action: "accept" | "decline") => {
    startTransition(async () => {
      const res = await respondToFriendRequest(id, action);
      if (res.success) {
        toast.success(`Request ${action}ed`);
        fetchRequests();
      } else {
        toast.error("Failed to process request");
      }
    });
  };

  return (
    <Dialog.Root onOpenChange={(open) => open && fetchRequests()}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-50 animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-medium dark:text-white">
              Contact requests
            </Dialog.Title>
            <Dialog.Close
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Close dialog"
            >
              <IconX />
            </Dialog.Close>
          </div>

          <div className="h-px bg-black/10 dark:bg-white/10 mb-4" />

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </p>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {requests.length === 0 && (
              <p className="text-center py-8 text-gray-400">
                No requests at the moment...
              </p>
            )}

            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-2 border border-black/10 dark:border-white/10 rounded-md"
              >
                {req.requester.avatarKey ? (
                  <div className="size-10 rounded-md overflow-hidden bg-zinc-100 relative shrink-0">
                    <Image
                      src={
                        req.requester.avatarKey
                          ? `${apiBase}/uploads/view?key=${req.requester.avatarKey}`
                          : "/placeholder-avatar.png"
                      }
                      alt={req.requester.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-10 rounded-sm bg-[#F1F1F1] dark:bg-zinc-950 flex items-center justify-center">
                    <span className="text-lg font-medium text-[#1E1E1E] dark:text-white">
                      {req.requester.username[0]}
                    </span>
                  </div>
                )}

                <span className="font-medium text-lg dark:text-white truncate">
                  {req.requester.username}
                </span>

                <div className="flex gap-2 ml-auto">
                  <Dialog.Close asChild>
                    <IconButton
                      disabled={isPending}
                      onClick={() => handleResponse(req.id, "accept")}
                      className="size-7 bg-green-200 text-green-600 dark:text-green-400 hover:underline disabled:opacity-50"
                      aria-label="Accept"
                    >
                      <IconCheck />
                    </IconButton>
                  </Dialog.Close>
                  <Dialog.Close asChild>
                    <IconButton
                      disabled={isPending}
                      onClick={() => handleResponse(req.id, "decline")}
                      className="size-7 text-red-600 dark:text-red-400 bg-red-200  disabled:opacity-50"
                      aria-label="Decline"
                    >
                      <IconX />
                    </IconButton>
                  </Dialog.Close>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

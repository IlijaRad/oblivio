"use client";

import { SelectedContact } from "@/lib/definitions";
import IconLock from "../../icons/icon-lock";

type ChatStyles = {
  headerText: string;
};

export default function EmptyState({
  contact,
  styles,
}: {
  contact: SelectedContact;
  styles: ChatStyles;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="size-20 rounded-full bg-transparent flex items-center justify-center mb-4 shadow-sm border border-black/5 dark:border-white/20">
        <IconLock />
      </div>
      <h3 className={`text-lg font-medium ${styles.headerText}`}>
        No messages yet
      </h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-60">
        Say hi to&nbsp;
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          {contact.username}
        </span>
        &nbsp; to start the conversation!
      </p>
    </div>
  );
}

import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getUser } from "@/lib/actions/auth/get-user";
import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getChat } from "@/lib/actions/thread/get-chat";
import Chat from "@/ui/components/chat";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ChatLoader />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [chat, contactsList] = await Promise.all([getChat(id), getContacts()]);
  const user = await getUser();

  if (!chat || !user || "errors" in user) {
    redirect("/");
  }

  const currentContact = contactsList.filter((contact) => contact.id === id)[0];

  return <Chat currentUser={user} contact={currentContact} />;
}

function ChatLoader() {
  return (
    <div className="flex-1 lg:mr-8">
      <div className="size-full lg:rounded-md flex flex-col bg-white dark:bg-zinc-900">
        <div className="flex items-center justify-between shrink-0 p-4 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="size-10 md:size-11 rounded-md bg-gray-200/80 dark:bg-zinc-800/80 animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            <div className="size-9 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            <div className="size-9 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            <div className="size-9 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden py-5 px-4">
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="flex gap-3 items-start">
              <div className="size-11 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="max-w-[65%]">
                <div className="rounded-2xl px-4 py-3 bg-gray-200 dark:bg-zinc-800">
                  <div className="h-4 w-48 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-300 dark:bg-zinc-700 rounded mt-2 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 items-start justify-end">
              <div className="max-w-[65%]">
                <div className="rounded-2xl px-4 py-3 bg-gray-200 dark:bg-zinc-800">
                  <div className="h-4 w-40 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
              <div className="size-11 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            </div>

            <div className="flex gap-3 items-start">
              <div className="size-11 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
              <div className="max-w-[65%]">
                <div className="rounded-2xl px-4 py-3 bg-gray-200 dark:bg-zinc-800">
                  <div className="h-4 w-56 bg-gray-300 dark:bg-zinc-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 shrink-0">
          <div className="flex-1 h-12 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
          <div className="size-12 rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

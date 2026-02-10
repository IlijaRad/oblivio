import { getUser } from "@/lib/actions/auth/get-user";
import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getChat } from "@/lib/actions/thread/get-chat";
import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import ChatLoader from "@/ui/chat-loader";
import Chat from "@/ui/components/chat";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ChatLoader />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value;

  const [chat, contactsList, user] = await Promise.all([
    getChat(id),
    getContacts(),
    getUser(),
  ]);

  if (user && "unauthorized" in user) {
    redirect("/api/auth/logout");
  }

  if (chat && "unauthorized" in chat) {
    redirect("/api/auth/logout");
  }

  if (contactsList && "unauthorized" in contactsList) {
    redirect("/api/auth/logout");
  }

  if (!user || "errors" in user) {
    redirect("/");
  }

  if (!chat || "errors" in chat) {
    redirect("/");
  }

  if (!Array.isArray(contactsList)) {
    redirect("/");
  }

  const currentContact = contactsList.find((contact) => contact.id === id);

  if (!currentContact) {
    redirect("/");
  }

  return <Chat currentUser={user} contact={currentContact} token={token} />;
}

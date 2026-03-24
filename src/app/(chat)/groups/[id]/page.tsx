import { getUser } from "@/lib/actions/auth/get-user";
import { getFriends } from "@/lib/actions/friends/get-friends";
import { getGroup } from "@/lib/actions/groups/actions";
import ChatLoader from "@/ui/chat-loader";
import GroupChat from "@/ui/components/chat/group-chat";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default function GroupPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ChatLoader />}>
      <GroupChatPage params={props.params} />
    </Suspense>
  );
}

async function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group, user, contactsList] = await Promise.all([
    getGroup(id),
    getUser(),
    getFriends(),
  ]);

  if (user && "licenseRequired" in user) redirect("/license");
  if (user && "unauthorized" in user) redirect("/api/auth/logout");
  if (group && "unauthorized" in group) redirect("/api/auth/logout");
  if (!user || "errors" in user) redirect("/");
  if (!group || "error" in group) redirect("/");

  return (
    <GroupChat
      initialGroup={group}
      currentUser={user}
      contacts={Array.isArray(contactsList) ? contactsList : []}
    />
  );
}

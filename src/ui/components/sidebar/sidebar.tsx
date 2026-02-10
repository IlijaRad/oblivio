import { getContacts, type Contact } from "@/lib/actions/friends/get-contacts";
import { getFriends } from "@/lib/actions/friends/get-friends";
import { SidebarContact } from "@/lib/definitions";
import { redirect } from "next/navigation";
import { SidebarClient } from "./sidebar-client";

export async function Sidebar() {
  const [friendsList, contactsList] = await Promise.all([
    getFriends(),
    getContacts(),
  ]);

  if (friendsList && "unauthorized" in friendsList) {
    redirect("/api/auth/logout");
  }

  if (contactsList && "unauthorized" in contactsList) {
    redirect("/api/auth/logout");
  }

  let initialFriends: SidebarContact[] = [];
  if (Array.isArray(friendsList) && Array.isArray(contactsList)) {
    const avatarMap = new Map(
      contactsList
        .filter((c: Contact) => c.avatarKey)
        .map((c: Contact) => [c.id, c.avatarKey as string]),
    );

    initialFriends = friendsList.map((friend) => ({
      ...friend,
      avatarKey: avatarMap.get(friend.id) || null,
    }));
  }

  return <SidebarClient initialFriends={initialFriends} />;
}

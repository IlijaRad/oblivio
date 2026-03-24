import { getUser } from "@/lib/actions/auth/get-user";
import { getContacts, type Contact } from "@/lib/actions/friends/get-contacts";
import { getFriends } from "@/lib/actions/friends/get-friends";
import { getGroups } from "@/lib/actions/groups/actions";
import { Group, SidebarContact } from "@/lib/definitions";
import { redirect } from "next/navigation";
import { SidebarClient } from "./sidebar-client";

export async function Sidebar() {
  const [friendsList, contactsList, groupsList, currentUser] =
    await Promise.all([getFriends(), getContacts(), getGroups(), getUser()]);

  if (currentUser && "licenseRequired" in currentUser) redirect("/license");
  if (currentUser && "unauthorized" in currentUser)
    redirect("/api/auth/logout");
  if (friendsList && "unauthorized" in friendsList)
    redirect("/api/auth/logout");
  if (contactsList && "unauthorized" in contactsList)
    redirect("/api/auth/logout");
  if (groupsList && "unauthorized" in groupsList) redirect("/api/auth/logout");

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

  const initialGroups: Group[] = Array.isArray(groupsList) ? groupsList : [];

  return (
    <SidebarClient
      initialFriends={initialFriends}
      initialGroups={initialGroups}
      currentUserId={"id" in currentUser ? currentUser.id : ""}
    />
  );
}

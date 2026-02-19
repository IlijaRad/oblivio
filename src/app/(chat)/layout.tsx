import { getUser } from "@/lib/actions/auth/get-user";
import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { AUTHENTICATION_COOKIE_NAME } from "@/lib/definitions";
import { HeaderClient } from "@/ui/components/header/header-client";
import { Sidebar } from "@/ui/components/sidebar/sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ClientLayout } from "./client-layout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTHENTICATION_COOKIE_NAME)?.value;

  const [user, friendRequests, contactsList] = await Promise.all([
    getUser(),
    getFullFriendRequests(),
    getContacts(),
  ]);

  if (user && "unauthorized" in user) {
    redirect("/api/auth/logout");
  }

  if (!user || "errors" in user) {
    redirect("/api/auth/logout");
  }

  if (friendRequests && "unauthorized" in friendRequests) {
    redirect("/api/auth/logout");
  }

  const count = Array.isArray(friendRequests) ? friendRequests.length : 0;

  const contacts = Array.isArray(contactsList)
    ? contactsList.map((c) => ({ id: c.id, username: c.username }))
    : [];

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <ClientLayout userId={user.id} token={token} contacts={contacts}>
        <HeaderClient user={user} initialRequestCount={count} />
        <main className="flex-1 min-h-0">
          <div className="flex h-full gap-5 lg:pb-4 lg:gap-5.5 relative">
            <Sidebar />
            {children}
          </div>
        </main>
      </ClientLayout>
    </div>
  );
}

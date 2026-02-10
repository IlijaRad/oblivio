import { getUser } from "@/lib/actions/auth/get-user";
import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { HeaderClient } from "@/ui/components/header/header-client";
import { Sidebar } from "@/ui/components/sidebar/sidebar";
import { redirect } from "next/navigation";
import { ClientLayout } from "./client-layout";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, friendRequests] = await Promise.all([
    getUser(),
    getFullFriendRequests(),
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

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <ClientLayout userId={user.id}>
        <HeaderClient user={user} initialRequestCount={count} />
        <main className="flex-1 min-h-0">
          <div className="flex h-full gap-5 lg:gap-5.5 relative">
            <Sidebar />
            {children}
          </div>
        </main>
      </ClientLayout>
    </div>
  );
}

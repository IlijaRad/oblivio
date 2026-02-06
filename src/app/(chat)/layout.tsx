import { WebSocketProvider } from "@/context/WebSocketProvider";
import { getUser } from "@/lib/actions/auth/get-user";
import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { Header } from "@/ui/components/header/header";
import { Sidebar } from "@/ui/components/sidebar/sidebar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const friendRequests = await getFullFriendRequests();
  const count = Array.isArray(friendRequests) ? friendRequests.length : 0;
  const user = await getUser();

  if (!user || "errors" in user) {
    return null;
  }

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden">
      <Header user={user} requestCount={count} />

      <main className="flex-1 min-h-0">
        <div className="flex h-full gap-5 lg:gap-5.5 relative">
          <Sidebar />
          <WebSocketProvider userId={user.id}>{children}</WebSocketProvider>
        </div>
      </main>
    </div>
  );
}

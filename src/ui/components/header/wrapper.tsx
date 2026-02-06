import { getUser } from "@/lib/actions/auth/get-user";
import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { Header } from "./header";

export default async function Wrapper() {
  const friendRequests = await getFullFriendRequests();
  const user = await getUser();

  if ((user && "errors" in user) || !user) return null;

  const count = Array.isArray(friendRequests) ? friendRequests.length : 0;

  return <Header requestCount={count} user={user} />;
}

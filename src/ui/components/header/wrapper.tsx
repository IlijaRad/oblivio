import { getFullFriendRequests } from "@/lib/actions/friends/get-requests";
import { User } from "@/lib/definitions";
import { Header } from "./header";

export default async function Wrapper({ user }: { user: User }) {
  const friendRequests = await getFullFriendRequests();

  const count = Array.isArray(friendRequests) ? friendRequests.length : 0;

  return <Header requestCount={count} user={user} />;
}

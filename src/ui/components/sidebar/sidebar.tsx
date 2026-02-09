"use client";

import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getFriends } from "@/lib/actions/friends/get-friends";
import { searchFriends } from "@/lib/actions/friends/search";
import { SelectedContact } from "@/lib/definitions";

import { IconSearch } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import AddContactModal from "./add-contact-modal";
import ContactItem from "./contact-item";

export type SidebarContact = SelectedContact & {
  email?: string | null;
  since?: string;
};

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<SidebarContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SidebarContact[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const [friendsList, contactsList] = await Promise.all([
          getFriends(),
          getContacts(),
        ]);

        const avatarMap = new Map(
          contactsList
            .filter((c) => c.avatarKey)
            .map((c) => [c.id, c.avatarKey]),
        );

        const mergedFriends: SidebarContact[] = friendsList.map((friend) => ({
          ...friend,
          avatarKey: avatarMap.get(friend.id) || null,
        }));

        setFriends(mergedFriends);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions((prev) => (prev.length > 0 ? [] : prev));
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await searchFriends(searchQuery);

        const friendIds = new Set(friends.map((f) => f.id));
        const newSuggestions: SidebarContact[] = results
          .filter((r) => !friendIds.has(r.id))
          .map((r) => ({
            ...r,
            avatarKey: (r as SidebarContact).avatarKey ?? null,
          }));

        setSuggestions(newSuggestions);
      } catch (e) {
        console.error("Search failed", e);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter((f) =>
      f.username.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, friends]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <aside
      className={twMerge(
        "w-full lg:max-w-70 shrink-0 h-full lg:pr-0 lg:pl-8",
        pathname === "/"
          ? "block px-4 sm:px-6"
          : "hidden lg:block pl-4 sm:pl-6",
      )}
    >
      <div className="w-full h-[calc(100vh-77px)] bg-white dark:bg-zinc-900 rounded-md flex flex-col">
        <div className="px-3 py-4 flex items-center justify-between">
          <h2 className="text-xl font-normal">Contacts</h2>
          <AddContactModal />
        </div>

        <div>
          <div className="px-4 pb-3">
            <div className="relative py-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11.25 px-4 pr-12 rounded-[5px] border ${
                  isSearching ? "border-[#1E1E1E]" : "border-[#989898]"
                } bg-[#F1F1F1] text-base text-[#1E1E1E] dark:border-white/70 dark:bg-transparent placeholder:text-[#989898] focus:outline-none dark:focus:border-white focus:border-[#1E1E1E] dark:text-gray-200`}
              />
              <IconSearch className="absolute size-5 text-[#989898] right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* {!isSearching && (
            <div className="px-4 pb-4">
              <button className="text-medium h-11 w-full flex items-center justify-center gap-2 bg-linear-to-r from-[#944C16] via-[#0D0D0F] via-[40.75%] dark:text-gray-950 to-[#0D0D0F] cursor-pointer rounded-md bg-gray-900 px-3.5 text-white disabled:cursor-not-allowed disabled:opacity-50 dark:via-none dark:to-white">
                New group
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white dark:text-gray-950"
                >
                  <path
                    d="M9 2.25C10.6144 2.25 11.925 3.56062 11.925 5.175C11.925 6.78938 10.6144 8.1 9 8.1C7.38562 8.1 6.075 6.78938 6.075 5.175C6.075 3.56062 7.38562 2.25 9 2.25ZM2.7 4.275C3.81937 4.275 4.725 5.18063 4.725 6.3C4.725 7.41938 3.81937 8.325 2.7 8.325C1.58062 8.325 0.675 7.41938 0.675 6.3C0.675 5.18063 1.58062 4.275 2.7 4.275ZM0 13.5C0 11.5116 1.61156 9.9 3.6 9.9C3.96 9.9 4.30875 9.95344 4.63781 10.0519C3.7125 11.0869 3.15 12.4538 3.15 13.95V14.4C3.15 14.7206 3.2175 15.0244 3.33844 15.3H0.9C0.402187 15.3 0 14.8978 0 14.4V13.5ZM14.6616 15.3C14.7825 15.0244 14.85 14.7206 14.85 14.4V13.95C14.85 12.4538 14.2875 11.0869 13.3622 10.0519C13.6912 9.95344 14.04 9.9 14.4 9.9C16.3884 9.9 18 11.5116 18 13.5V14.4C18 14.8978 17.5978 15.3 17.1 15.3H14.6616ZM13.275 6.3C13.275 5.18063 14.1806 4.275 15.3 4.275C16.4194 4.275 17.325 5.18063 17.325 6.3C17.325 7.41938 16.4194 8.325 15.3 8.325C14.1806 8.325 13.275 7.41938 13.275 6.3ZM4.5 13.95C4.5 11.4637 6.51375 9.45 9 9.45C11.4862 9.45 13.5 11.4637 13.5 13.95V14.4C13.5 14.8978 13.0978 15.3 12.6 15.3H5.4C4.90219 15.3 4.5 14.8978 4.5 14.4V13.95Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>
          )} */}
        </div>

        <div className="px-4 pb-6 flex flex-col min-h-0">
          {isSearching ? (
            <>
              {filteredFriends.length > 0 && (
                <>
                  <div className="border-t border-[#BABABA] mb-4"></div>
                  <div className="mb-3">
                    <h2 className="text-[16px] font-semibold text-[#1E1E1E] leading-5">
                      Your friends:
                    </h2>
                    <p className="text-[14px] font-normal text-[#989898] leading-5">
                      {filteredFriends.length}{" "}
                      {filteredFriends.length === 1 ? "Result" : "Results"}
                    </p>
                  </div>
                  <div className="space-y-2 mb-6">
                    {filteredFriends.map((contact) => (
                      <ContactItem
                        key={contact.id}
                        contact={contact}
                        searchQuery={searchQuery}
                        isActive={pathname.slice(1) === contact.id}
                        isLink
                      />
                    ))}
                  </div>
                </>
              )}

              {suggestions.length > 0 && (
                <>
                  <div className="border-t border-[#BABABA] mb-4"></div>
                  <div className="mb-3">
                    <h2 className="text-[16px] font-semibold text-[#1E1E1E] leading-5">
                      Add friends:
                    </h2>
                    <p className="text-[14px] font-normal text-[#989898] leading-5">
                      {suggestions.length}{" "}
                      {suggestions.length === 1 ? "Result" : "Results"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((contact) => (
                      <ContactItem
                        key={contact.id}
                        contact={contact}
                        searchQuery={searchQuery}
                        showAddButton
                      />
                    ))}
                  </div>
                </>
              )}

              {filteredFriends.length === 0 && suggestions.length === 0 && (
                <div className="flex-1 flex items-center justify-center px-6 text-center min-h-155">
                  <p className="text-[#989898] text-base font-normal leading-5">
                    No results found
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <ContactSkeleton key={i} />
                  ))}
                </div>
              ) : friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map((contact) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      searchQuery={searchQuery}
                      isActive={pathname.slice(1) === contact.id}
                      isLink
                    />
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center px-6 text-center min-h-40">
                  <p className="text-[#989898] text-sm font-normal">
                    You currently have no contacts
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function ContactSkeleton() {
  return (
    <div className="h-9.5 w-full rounded-md border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/20 animate-pulse flex items-center px-1">
      <div className="w-7.75 h-7.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 shrink-0" />
      <div className="ml-2 h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
    </div>
  );
}

"use client";

import { searchFriends } from "@/lib/actions/friends/search";
import { SidebarContact } from "@/lib/definitions";
import { IconSearch } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import AddContactModal from "./add-contact-modal";
import ContactItem from "./contact-item";

interface SidebarProps {
  initialFriends: SidebarContact[];
}

export function SidebarClient({ initialFriends }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const friends = initialFriends;
  const [suggestions, setSuggestions] = useState<SidebarContact[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await searchFriends(searchQuery);

        if (results && "unauthorized" in results) {
          router.push("/api/auth/logout");
          return;
        }

        if (!Array.isArray(results)) {
          return;
        }

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
  }, [searchQuery, friends, router]);

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
              {friends.length > 0 ? (
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

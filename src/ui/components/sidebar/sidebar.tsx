"use client";

import { generateInviteLink } from "@/lib/actions/friends/generate-invite-link";
import { getContacts } from "@/lib/actions/friends/get-contacts";
import { getFriends } from "@/lib/actions/friends/get-friends";
import { searchFriends } from "@/lib/actions/friends/search";
import { SelectedContact } from "@/lib/definitions";
import * as Dialog from "@radix-ui/react-dialog";
import { IconPlus } from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import IconButton from "../icon-button";
import ContactItem from "./contact-item";
import ClickTooltip from "./tooltip";

export type SidebarContact = SelectedContact & {
  email?: string | null;
  since?: string;
};

export function Sidebar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState("");
  const [friends, setFriends] = useState<SidebarContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<SidebarContact[]>([]);
  const pathname = usePathname();

  const shareLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${token}`
      : "";

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

  async function getInviteLink() {
    const res = await generateInviteLink();
    if (res && "token" in res) {
      setToken(res.token);
    }
  }

  async function handleShareLink() {
    if (!token) return;
    const text = `Add me on Oblivio: ${shareLink}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Friend invite", text, url: shareLink });
      } catch {}
    } else {
      toast.error("Share option is unsupported by your browser!");
    }
  }

  async function copyInvite() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Link copied!");
    } catch {}
  }

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
          <Dialog.Root>
            <Dialog.Trigger
              className="w-8.75 h-8.25 rounded-md border border-black/60 flex items-center justify-center hover:bg-opacity-80 transition-colors"
              aria-label="Add contact"
            >
              <IconPlus size={20} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="data-[state=closed]:animate-overlayExit data-[state=open]:animate-overlayShow bg-black/80 fixed inset-0 z-50 cursor-pointer" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] md:w-full md:max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 dark:bg-zinc-900 outline-none">
                <Dialog.Title className="hidden">Add contact</Dialog.Title>
                <div className="flex pb-4 border-b border-b-black/20 dark:border-b-white justify-between items-center">
                  <span className="text-xl text-gray-900 dark:text-white">
                    Add new contact
                  </span>
                  <Dialog.Close asChild>
                    <IconButton className="border-0 -mr-2 text-zinc-900 dark:text-white">
                      <svg
                        width="23"
                        height="23"
                        viewBox="0 0 23 23"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="currentColor"
                          d="M6.58012 4.9378C6.1309 4.48858 5.40137 4.48858 4.95215 4.9378C4.50293 5.38702 4.50293 6.11655 4.95215 6.56577L9.88996 11.5L4.95574 16.4378C4.50652 16.887 4.50652 17.6165 4.95574 18.0658C5.40496 18.515 6.13449 18.515 6.58371 18.0658L11.5179 13.128L16.4557 18.0622C16.905 18.5114 17.6345 18.5114 18.0837 18.0622C18.5329 17.613 18.5329 16.8834 18.0837 16.4342L13.1459 11.5L18.0801 6.56217C18.5293 6.11295 18.5293 5.38342 18.0801 4.9342C17.6309 4.48499 16.9014 4.48499 16.4521 4.9342L11.5179 9.87202L6.58012 4.9378Z"
                        />
                      </svg>
                    </IconButton>
                  </Dialog.Close>
                </div>
                <div className="mt-4">
                  If you can’t find your friend via search, You can send an
                  invite link.
                </div>
                <button
                  onClick={getInviteLink}
                  type="submit"
                  className="text-medium mt-4 h-11 w-full bg-linear-to-r from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] cursor-pointer rounded-md dark:to-white dark:via-none dark:text-gray-950 bg-gray-900 px-3.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Generate invite link
                </button>
                {token && (
                  <div>
                    <div className="mt-5 w-full h-px bg-[#BABABA]" />
                    <div className="relative">
                      <input
                        readOnly
                        value={shareLink}
                        className="block text-zinc-900 dark:text-white font-medium pl-3 pr-10 mt-5 h-9.5 dark:border-white border-black/20 w-full rounded-md border text-ellipsis"
                      />
                      <ClickTooltip onClick={copyInvite} />
                    </div>
                    <button
                      onClick={handleShareLink}
                      className="w-full cursor-pointer h-11 px-6 mt-9 rounded-md font-medium border border-[rgba(148,76,22,1)] flex items-center gap-x-2 justify-center text-[rgba(148,76,22,1)] dark:text-white dark:border-white"
                    >
                      Share invite link
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.0156 2.74995V4.99995H11.0156C8.53125 4.99995 6.51562 7.01557 6.51562 9.49995C6.51562 12.4187 9.10313 13.7125 9.65938 13.9562C9.72813 13.9874 9.80313 13.9999 9.88125 13.9999H9.95938C10.2656 13.9999 10.5156 13.7499 10.5156 13.4437C10.5156 13.1843 10.3313 12.9593 10.1156 12.8093C9.8375 12.6156 9.51562 12.2406 9.51562 11.5437C9.51562 10.1374 10.6562 8.99682 12.0625 8.99682H13.0156V11.2468C13.0156 11.5499 13.1969 11.8249 13.4781 11.9406C13.7594 12.0562 14.0813 11.9937 14.2969 11.7781L18.5469 7.52807C18.8406 7.23432 18.8406 6.75933 18.5469 6.4687L14.2969 2.2187C14.0813 2.00307 13.7594 1.94057 13.4781 2.0562C13.1969 2.17182 13.0156 2.44682 13.0156 2.74995ZM4.51562 4.99995C3.13437 4.99995 2.01562 6.1187 2.01562 7.49995V15.4999C2.01562 16.8812 3.13437 18 4.51562 18H12.5156C13.8969 18 15.0156 16.8812 15.0156 15.4999V14.4999C15.0156 13.9468 14.5688 13.4999 14.0156 13.4999C13.4625 13.4999 13.0156 13.9468 13.0156 14.4999V15.4999C13.0156 15.7749 12.7906 15.9999 12.5156 15.9999H4.51562C4.24062 15.9999 4.01562 15.7749 4.01562 15.4999V7.49995C4.01562 7.22495 4.24062 6.99995 4.51562 6.99995H5.01562C5.56875 6.99995 6.01562 6.55307 6.01562 5.99995C6.01562 5.44683 5.56875 4.99995 5.01562 4.99995H4.51562Z"
                          fill="url(#paint0_linear_106_783)"
                        />
                        <defs>
                          <linearGradient
                            id="paint0_linear_106_783"
                            x1="2.01562"
                            y1="18"
                            x2="9.08263"
                            y2="17.7275"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop className="[stop-color:#944C1] dark:[stop-color:#fff]" />
                            <stop
                              offset="1"
                              className="[stop-color:#0D0D0] dark:[stop-color:#fff]"
                            />
                          </linearGradient>
                        </defs>
                      </svg>
                    </button>
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
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
              <svg
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 8.5C15 9.93437 14.5344 11.2594 13.75 12.3344L17.7062 16.2938C18.0969 16.6844 18.0969 17.3188 17.7062 17.7094C17.3156 18.1 16.6812 18.1 16.2906 17.7094L12.3344 13.75C11.2594 14.5344 9.93437 15 8.5 15C4.90937 15 2 12.0906 2 8.5C2 4.90937 4.90937 2 8.5 2C12.0906 2 15 4.90937 15 8.5ZM8.5 13C10.9844 13 13 10.9844 13 8.5C13 6.01562 10.9844 4 8.5 4C6.01562 4 4 6.01562 4 8.5C4 10.9844 6.01562 13 8.5 13Z"
                  fill="#989898"
                />
              </svg>
            </div>
          </div>

          {!isSearching && (
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
          )}
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

const ContactSkeleton = () => (
  <div className="h-9.5 w-full rounded-md border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/20 animate-pulse flex items-center px-1">
    <div className="w-7.75 h-7.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 shrink-0" />
    <div className="ml-2 h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
  </div>
);

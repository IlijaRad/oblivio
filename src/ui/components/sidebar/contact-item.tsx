import { addFriend } from "@/lib/actions/friends/add-friend";
import { Contact } from "@/lib/actions/friends/get-contacts";
import { SidebarContact } from "@/lib/definitions";
import { IconPlus } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

const ContactItem = ({
  searchQuery,
  contact,
  showAddButton = false,
  isActive,
  isLink = false,
}: {
  searchQuery: string;
  contact: SidebarContact;
  showAddButton?: boolean;
  isActive?: boolean;
  isLink?: boolean;
}) => {
  const [isPending, startTransition] = useTransition();

  const handleAddFriend = (e: React.MouseEvent) => {
    e.stopPropagation();

    startTransition(async () => {
      const result = await addFriend(contact.username);

      if (result.success) {
        toast.success(`Friend request sent to ${contact.username}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!contact) return null;

  const renderContactName = (name: string) => {
    if (!searchQuery.trim()) {
      return <span className="dark:text-white text-zinc-900">{name}</span>;
    }

    const query = searchQuery.toLowerCase();
    const lowerName = name.toLowerCase();
    const index = lowerName.indexOf(query);

    if (index === -1) {
      return <span className="dark:text-white text-zinc-900">{name}</span>;
    }

    const before = name.slice(0, index);
    const match = name.slice(index, index + query.length);
    const after = name.slice(index + query.length);

    return (
      <span className="text-[16px] text-[#1E1E1E]">
        <span className="font-semibold">
          {before}
          {match}
        </span>
        <span className="font-normal">{after}</span>
      </span>
    );
  };

  return (
    <Link
      href={isLink ? `/${contact.id}` : "?"}
      className={`h-9.5 rounded-md border flex items-center px-1 cursor-pointer ${
        isActive
          ? "border-[#944C16] bg-zinc-50 dark:bg-white/5"
          : "border-[#989898] bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-white/5"
      }`}
    >
      <div className="relative shrink-0">
        {contact.avatarKey ? (
          <div className="w-7.75 h-7.5 rounded-sm overflow-hidden relative">
            <Image
              src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/view?key=${encodeURIComponent((contact as Contact).avatarKey || "")}`}
              alt={contact.username}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-7.75 h-7.5 rounded-sm bg-[#F1F1F1] dark:bg-zinc-950 flex items-center justify-center">
            <span className="text-[18px] font-medium text-[#1E1E1E] dark:text-white uppercase">
              {contact.username[0]}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 px-2 overflow-hidden">
        <div className="truncate dark:text-white text-zinc-900">
          {renderContactName(contact.username)}
        </div>
      </div>

      {showAddButton && (
        <button
          onClick={handleAddFriend}
          disabled={isPending}
          className="shrink-0 size-6 rounded-sm border border-[#989898] bg-[#F1F1F1] dark:bg-zinc-800 dark:border-white/20 flex items-center justify-center mr-1 hover:bg-[#E5E5E5] dark:hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <div className="size-3 border-2 border-zinc-400 border-t-transparent animate-spin rounded-full" />
          ) : (
            <span className="font-semibold text-[#1E1E1E] dark:text-white leading-none">
              <IconPlus size={16} />
            </span>
          )}
        </button>
      )}
    </Link>
  );
};

export default ContactItem;

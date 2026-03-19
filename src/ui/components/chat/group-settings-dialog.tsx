"use client";
import {
  getAvatarPresignedUrl,
  updateGroupAvatarKey,
} from "@/lib/actions/auth/avatar";
import {
  addGroupMembers,
  deleteGroup,
  removeGroupMember,
  updateGroupName,
} from "@/lib/actions/groups/actions";
import { GroupDetail, SidebarContact } from "@/lib/definitions";
import IconUpload from "@/ui/icons/icon-upload";
import * as Dialog from "@radix-ui/react-dialog";
import { IconPlus, IconUserMinus, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface GroupSettingsDialogProps {
  group: GroupDetail;
  currentUserId: string;
  contacts: SidebarContact[];
  apiBase?: string;
  onGroupUpdated?: (group: GroupDetail) => void;
  onGroupRenamed?: (groupId: string, name: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GroupSettingsDialog({
  group,
  currentUserId,
  contacts,
  apiBase,
  onGroupUpdated,
  onGroupRenamed,
  open,
  onOpenChange,
}: GroupSettingsDialogProps) {
  const router = useRouter();
  const [groupName, setGroupName] = useState(group.name || "");
  const [members, setMembers] = useState(group.members);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [avatarKey, setAvatarKey] = useState<string | null>(
    group.avatarKey ?? null,
  );

  const fileInput = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; size: number }>({
    x: 0,
    y: 0,
    size: 200,
  });

  const currentMemberIds = new Set(members.map((m) => m.userId));
  const addableContacts = contacts.filter((c) => !currentMemberIds.has(c.id));
  const filteredAddable = addableContacts.filter((c) =>
    c.username.toLowerCase().includes(addSearch.toLowerCase()),
  );
  const isAdmin =
    members.find((m) => m.userId === currentUserId)?.isAdmin ?? false;

  useEffect(() => {
    if (!open) {
      setGroupName(group.name || "");
      setShowAddMembers(false);
      setAddSearch("");
      setSelectedNewMembers(new Set());
      setConfirmDelete(false);
      setCropOpen(false);
      setPreviewUrl(null);
      setImgEl(null);
    }
  }, [open]);

  useEffect(() => {
    setMembers(group.members);
  }, [group.members]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const img = document.createElement("img");
      img.onload = () => {
        setImgEl(img);
        const size = Math.min(img.width, img.height);
        setBox({
          x: Math.floor((img.width - size) / 2),
          y: Math.floor((img.height - size) / 2),
          size,
        });
        setPreviewUrl(r.result as string);
        setCropOpen(true);
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
    e.target.value = "";
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (!imgEl || !canvasRef.current || !cropOpen) return;
      const c = canvasRef.current;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      c.width = 320;
      c.height = 320;
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, c.width, c.height);
      const scale = Math.min(c.width / imgEl.width, c.height / imgEl.height);
      const w = imgEl.width * scale;
      const h = imgEl.height * scale;
      const ox = (c.width - w) / 2;
      const oy = (c.height - h) / 2;
      ctx.drawImage(imgEl, ox, oy, w, h);
      const bx = ox + box.x * scale;
      const by = oy + box.y * scale;
      const bs = box.size * scale;
      ctx.strokeStyle = "#944C16";
      ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bs, bs);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(ox, oy, w, by - oy);
      ctx.fillRect(ox, by + bs, w, h - (by - oy) - bs);
      ctx.fillRect(ox, by, bx - ox, bs);
      ctx.fillRect(bx + bs, by, w - (bx - ox) - bs, bs);
    });
    return () => cancelAnimationFrame(handle);
  }, [imgEl, box, previewUrl, cropOpen]);

  const getClientCoords = (ev: MouseEvent | TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in ev) {
      clientX = ev.touches[0].clientX;
      clientY = ev.touches[0].clientY;
    } else {
      clientX = ev.clientX;
      clientY = ev.clientY;
    }
    return { clientX, clientY, rect };
  };

  const handleStart = (ev: React.MouseEvent | React.TouchEvent) => {
    ev.preventDefault();
    const { clientX, clientY, rect } = getClientCoords(ev.nativeEvent);
    setDrag({
      x: box.x,
      y: box.y,
      startX: clientX - rect.left,
      startY: clientY - rect.top,
    });
  };

  const handleMove = (ev: React.MouseEvent | React.TouchEvent) => {
    if (!drag || !imgEl) return;
    ev.preventDefault();
    const { clientX, clientY, rect } = getClientCoords(ev.nativeEvent);
    const nx = Math.max(
      0,
      Math.min(
        imgEl.width - box.size,
        drag.x + (clientX - rect.left - drag.startX) / (rect.width / 320),
      ),
    );
    const ny = Math.max(
      0,
      Math.min(
        imgEl.height - box.size,
        drag.y + (clientY - rect.top - drag.startY) / (rect.height / 320),
      ),
    );
    setBox({ ...box, x: Math.floor(nx), y: Math.floor(ny) });
  };

  const handleEnd = () => setDrag(null);

  const handleCropConfirm = async () => {
    if (!imgEl) return;
    setIsUploadingAvatar(true);
    try {
      const out = document.createElement("canvas");
      out.width = 512;
      out.height = 512;
      const octx = out.getContext("2d")!;
      octx.drawImage(imgEl, box.x, box.y, box.size, box.size, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((res) =>
        out.toBlob((b) => res(b!), "image/jpeg", 0.9),
      );
      const presign = await getAvatarPresignedUrl(blob.type, blob.size);
      if (presign.error) {
        toast.error(presign.error);
        return;
      }
      const uploadRes = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": blob.type },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error("S3 Upload failed");
      const updateRes = await updateGroupAvatarKey(group.id, presign.key);
      if (updateRes?.error) {
        toast.error(updateRes.error);
        return;
      }
      setAvatarKey(presign.key);
      onGroupUpdated?.({ ...group, members, avatarKey: presign.key });
      toast.success("Group picture updated");
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      setCropOpen(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setIsRemoving(userId);
    try {
      const result = await removeGroupMember(group.id, userId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const updated = members.filter((m) => m.userId !== userId);
      setMembers(updated);
      onGroupUpdated?.({ ...group, members: updated });
      toast.success("Member removed");
    } finally {
      setIsRemoving(null);
    }
  };

  const handleAddMembers = async () => {
    if (selectedNewMembers.size === 0) return;
    setIsAdding(true);
    try {
      const result = await addGroupMembers(
        group.id,
        Array.from(selectedNewMembers),
      );
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const newMembers = contacts
        .filter((c) => selectedNewMembers.has(c.id))
        .map((c) => ({
          userId: c.id,
          username: c.username,
          avatarKey: c.avatarKey ?? null,
          isAdmin: false,
          joinedAt: Date.now(),
        }));
      const updated = [...members, ...newMembers];
      setMembers(updated);
      onGroupUpdated?.({ ...group, members: updated });
      setSelectedNewMembers(new Set());
      setShowAddMembers(false);
      setAddSearch("");
      toast.success("Members added");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditName = async () => {
    if (!groupName.trim()) return;
    const result = await updateGroupName(group.id, groupName.trim());
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    onGroupUpdated?.({ ...group, name: groupName.trim() });
    onGroupRenamed?.(group.id, groupName.trim());
    toast.success("Group name updated");
  };

  const handleDeleteGroup = async () => {
    const result = await deleteGroup(group.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Group deleted");
    router.push("/");
  };

  const currentAvatarUrl = avatarKey
    ? `${apiBase}/uploads/view?key=${encodeURIComponent(avatarKey)}&t=${Date.now()}`
    : null;

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />

      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-medium dark:text-white">
                Group Settings
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white cursor-pointer transition-colors"
                  aria-label="Close"
                >
                  <IconX size={20} />
                </button>
              </Dialog.Close>
            </div>

            <div
              className="h-px w-full bg-black/20 dark:bg-white/20 mb-6"
              aria-hidden
            />

            <div className="flex flex-col flex-1 overflow-y-auto pb-6">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                    {currentAvatarUrl ? (
                      <Image
                        src={currentAvatarUrl}
                        alt="Group avatar"
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="text-xl font-semibold text-gray-500 dark:text-gray-300 uppercase">
                        {(group.name || "G")[0]}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => fileInput.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                      title="Change group picture"
                    >
                      {isUploadingAvatar ? (
                        <div className="w-2.5 h-2.5 border border-gray-400 border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <IconUpload className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">
                    Group name
                  </label>
                  {isAdmin ? (
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Type here..."
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEditName()}
                        className="w-full min-w-0 px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-[#1E1E1E] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1E1E1E] dark:focus:border-white"
                      />
                      <button
                        onClick={handleEditName}
                        disabled={
                          !groupName.trim() ||
                          groupName.trim() === (group.name || "")
                        }
                        className="shrink-0 px-3 py-2 rounded-md dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#1E1E1E] dark:text-white px-1">
                      {group.name || "—"}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white py-5">
                  {members.length} Members
                </p>
                <div className="flex flex-col gap-1">
                  {members.map((member) => {
                    const isSelf = member.userId === currentUserId;
                    const memberAvatarUrl = member.avatarKey
                      ? `${apiBase}/uploads/view?key=${encodeURIComponent(member.avatarKey)}`
                      : null;
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-zinc-800"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {memberAvatarUrl ? (
                            <Image
                              src={memberAvatarUrl}
                              alt={member.username}
                              width={32}
                              height={32}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                              {member.username[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-[#1E1E1E] dark:text-white truncate block">
                            {isSelf ? "You" : member.username}
                          </span>
                          {member.isAdmin && (
                            <span className="text-xs text-gray-400">Admin</span>
                          )}
                        </div>
                        {isAdmin && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={isRemoving === member.userId}
                            className="shrink-0 p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            title="Remove member"
                          >
                            {isRemoving === member.userId ? (
                              <div className="w-4 h-4 border-2 border-red-400 border-t-transparent animate-spin rounded-full" />
                            ) : (
                              <IconUserMinus size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isAdmin &&
                    (!showAddMembers ? (
                      <button
                        onClick={() => setShowAddMembers(true)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                          <IconPlus size={16} className="text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-400">
                          Add New Members
                        </span>
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2 mt-1">
                        <input
                          type="text"
                          placeholder="Search contacts..."
                          value={addSearch}
                          onChange={(e) => setAddSearch(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm text-[#1E1E1E] dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#1E1E1E] dark:focus:border-white"
                        />
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                          {filteredAddable.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              No contacts to add
                            </p>
                          )}
                          {filteredAddable.map((c) => {
                            const isSelected = selectedNewMembers.has(c.id);
                            const cAvatarUrl = c.avatarKey
                              ? `${apiBase}/uploads/view?key=${encodeURIComponent(c.avatarKey)}`
                              : null;
                            return (
                              <button
                                key={c.id}
                                onClick={() =>
                                  setSelectedNewMembers((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(c.id)) {
                                      next.delete(c.id);
                                    } else {
                                      next.add(c.id);
                                    }

                                    return next;
                                  })
                                }
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                              >
                                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                                  {cAvatarUrl ? (
                                    <Image
                                      src={cAvatarUrl}
                                      alt={c.username}
                                      width={28}
                                      height={28}
                                      className="object-cover w-full h-full"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-500 uppercase">
                                      {c.username[0]}
                                    </span>
                                  )}
                                </div>
                                <span className="flex-1 text-sm text-[#1E1E1E] dark:text-white">
                                  {c.username}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "bg-[#1E1E1E] border-[#1E1E1E] dark:bg-white dark:border-white"
                                      : "border-gray-300 dark:border-zinc-500"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white dark:text-[#1E1E1E]"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddMembers(false);
                              setAddSearch("");
                              setSelectedNewMembers(new Set());
                            }}
                            className="flex-1 py-2 rounded-lg border border-black/20 dark:border-white/20 text-sm text-gray-900 dark:text-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddMembers}
                            disabled={isAdding || selectedNewMembers.size === 0}
                            className="flex-1 py-2 rounded-lg text-sm transition-opacity disabled:opacity-40 disabled:cursor-not-allowed dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white"
                          >
                            {isAdding
                              ? "Adding..."
                              : `Add (${selectedNewMembers.size})`}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full py-3 rounded-lg dark:bg-red-500 bg-red-600 text-white text-sm font-semibold transition-colors"
                  >
                    Delete Group
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-600 text-sm text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteGroup}
                        className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                      >
                        Yes, Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root
        open={cropOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCropOpen(false);
            setPreviewUrl(null);
            setImgEl(null);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-60 w-full max-w-md">
            <Dialog.Title className="text-lg font-medium mb-4 dark:text-white text-center">
              Crop group picture
            </Dialog.Title>
            <div className="flex justify-center bg-black rounded-md overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onTouchCancel={handleEnd}
                className="cursor-grab active:cursor-grabbing max-w-full touch-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setCropOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                disabled={isUploadingAvatar}
                className="flex-1 px-4 py-2 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md disabled:opacity-50"
              >
                {isUploadingAvatar ? "Uploading..." : "Save Picture"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

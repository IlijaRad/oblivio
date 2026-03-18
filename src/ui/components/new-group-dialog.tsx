"use client";

import { getAvatarPresignedUrl } from "@/lib/actions/auth/avatar";
import { createGroup } from "@/lib/actions/groups/actions";
import { Group, SidebarContact } from "@/lib/definitions";
import * as Dialog from "@radix-ui/react-dialog";
import { IconSearch, IconUsers, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import IconUpload from "../icons/icon-upload";

interface NewGroupDialogProps {
  contacts: SidebarContact[];
  apiBase?: string;
  onGroupCreated: (group: Group) => void;
}

export default function NewGroupDialog({
  contacts,
  apiBase,
  onGroupCreated,
}: NewGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Avatar upload state
  const fileInput = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
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

  const filtered = contacts.filter((c) =>
    c.username.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleMember = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Avatar helpers ---
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
    // Reset input so the same file can be re-selected
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
    const out = document.createElement("canvas");
    out.width = 512;
    out.height = 512;
    const octx = out.getContext("2d")!;
    octx.drawImage(imgEl, box.x, box.y, box.size, box.size, 0, 0, 512, 512);
    const blob = await new Promise<Blob>((res) =>
      out.toBlob((b) => res(b!), "image/jpeg", 0.9),
    );
    setCroppedBlob(blob);
    setCroppedPreview(out.toDataURL("image/jpeg", 0.9));
    setCropOpen(false);
    setPreviewUrl(null);
  };

  // --- Create group ---
  const handleCreate = async () => {
    const trimmed = groupName.trim();
    if (!trimmed) {
      setNameError(true);
      return;
    }
    if (selected.size < 1) {
      toast.error("Select at least one member");
      return;
    }

    setIsCreating(true);
    try {
      let avatarKey = null;

      // Upload avatar if one was cropped
      if (croppedBlob) {
        const presign = await getAvatarPresignedUrl(
          croppedBlob.type,
          croppedBlob.size,
        );
        if (presign.error) {
          toast.error(presign.error);
          return;
        }
        const uploadRes = await fetch(presign.url, {
          method: "PUT",
          headers: { "Content-Type": croppedBlob.type },
          body: croppedBlob,
        });
        if (!uploadRes.ok) throw new Error("S3 Upload failed");
        avatarKey = presign.key;
      }

      const result = await createGroup(
        trimmed,
        Array.from(selected),
        avatarKey,
      );
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      if ("unauthorized" in result) {
        router.push("/api/auth/logout");
        return;
      }
      toast.success("Group created!");
      setOpen(false);
      onGroupCreated(result);
      router.push(`/groups/${result.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setGroupName("");
      setNameError(false);
      setSelected(new Set());
      setSearch("");
      setCroppedBlob(null);
      setCroppedPreview(null);
      setPreviewUrl(null);
      setImgEl(null);
      setCropOpen(false);
    }
  }, [open]);

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button className="w-full mb-2 flex items-center gap-2 justify-center flex-1 px-4 py-3 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md disabled:opacity-50 cursor-pointer">
            New group
            <IconUsers size={16} />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-50 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-medium dark:text-white">
                New Group
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
              {/* Group avatar + name row */}
              <div className="flex items-center gap-3">
                {/* Avatar button */}
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="size-15 rounded-md bg-gray-100 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer"
                  title="Upload group picture"
                >
                  {croppedPreview ? (
                    <>
                      <Image
                        src={croppedPreview}
                        alt="Group avatar"
                        width={60}
                        height={60}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <IconUpload className="text-white w-5 h-5" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <IconUsers
                        size={22}
                        className="text-gray-400 group-hover:hidden"
                      />
                      <IconUpload className="text-gray-400 hidden group-hover:block w-5 h-5" />
                    </div>
                  )}
                </button>

                {/* Name input */}
                <div className="flex-1">
                  <label className="text-sm text-gray-700 font-medium dark:text-gray-300 mb-1 block">
                    Group name <span className="text-[#944C16]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Type here..."
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      if (e.target.value.trim()) setNameError(false);
                    }}
                    className={`w-full px-3 py-2 rounded-md border bg-white dark:bg-zinc-800 text-sm text-[#1E1E1E] dark:text-white placeholder:text-gray-400 focus:outline-none transition-colors ${
                      nameError
                        ? "border-red-500 focus:border-red-500"
                        : "border-[#989898] dark:border-zinc-600 focus:border-[#1E1E1E] dark:focus:border-white"
                    }`}
                  />
                  {nameError && (
                    <p className="text-xs text-red-500 mt-1">
                      Group name is required
                    </p>
                  )}
                </div>
              </div>

              <div
                className="h-px w-full bg-black/20 dark:bg-white/20 mt-5 mb-4"
                aria-hidden
              />

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-11.25 px-4 pr-12 rounded-md border-gray-500 dark:border-zinc-600 focus:outline-none focus:border-[#1E1E1E] dark:focus:border-white border bg-[#F1F1F1] text-base text-[#1E1E1E] dark:bg-transparent placeholder:text-[#989898] dark:text-gray-200"
                />
                <IconSearch className="absolute size-5 text-[#989898] right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {selected.size > 0 && (
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-5 mb-1">
                  {selected.size} Contact{selected.size !== 1 ? "s" : ""}{" "}
                  selected
                </p>
              )}

              <div className="flex flex-col gap-1 mt-4">
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No contacts found
                  </p>
                )}
                {filtered.map((contact) => {
                  const avatarUrl = contact.avatarKey
                    ? `${apiBase}/uploads/view?key=${encodeURIComponent(contact.avatarKey)}`
                    : null;
                  const isSelected = selected.has(contact.id);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => toggleMember(contact.id)}
                      className="flex items-center gap-3 pl-1 pr-2.5 py-0.5 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors w-full text-left border border-black/20 dark:border-white/20"
                    >
                      <div className="size-10 rounded-md bg-gray-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={contact.username}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {contact.username[0]}
                          </span>
                        )}
                      </div>
                      <span className="flex-1 text-gray-900 dark:text-white">
                        {contact.username}
                      </span>
                      <div
                        className={`size-5 rounded-sm flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-[linear-gradient(87.89deg,#944C16_0%,#0D0D0F_40.75%)] border-transparent dark:bg-[linear-gradient(87.89deg,#944C16_0%,#FFF_70%)] dark:bg-white dark:border-white"
                            : "border-gray-300 dark:border-zinc-500 border"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className={`w-3 h-3 ${isSelected ? "text-white dark:text-[#1E1E1E]" : ""}`}
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
            </div>

            <div>
              <button
                onClick={handleCreate}
                disabled={isCreating || selected.size === 0}
                className="w-full mt-6 h-11 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create New Group"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Crop dialog — rendered outside the main dialog to avoid z-index stacking issues */}
      <Dialog.Root
        open={cropOpen}
        onOpenChange={(o) => {
          if (!o) {
            setCropOpen(false);
            setPreviewUrl(null);
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
                onClick={() => {
                  setCropOpen(false);
                  setPreviewUrl(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-4 py-2 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md"
              >
                Use Picture
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

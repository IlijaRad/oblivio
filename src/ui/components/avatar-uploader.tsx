"use client";

import {
  getAvatarPresignedUrl,
  updateAvatarKey,
} from "@/lib/actions/auth/avatar";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import IconUpload from "../icons/icon-upload";

interface Props {
  initialAvatarKey: string;
  username: string;
}

export function AvatarUploader({ initialAvatarKey, username }: Props) {
  const router = useRouter();
  const [avatarKey, setAvatarKey] = useState(initialAvatarKey);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

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
      };
      img.src = r.result as string;
    };
    r.readAsDataURL(f);
  };

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (!imgEl || !canvasRef.current) return;

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
  }, [imgEl, box, previewUrl]);

  const handleUpload = async () => {
    if (!imgEl) return;
    setIsUploading(true);

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

      const updateRes = await updateAvatarKey(presign.key);

      if (updateRes.error) {
        toast.error(updateRes.error);
        return;
      }

      setAvatarKey(presign.key);
      setPreviewUrl(null);
      toast.success("Profile picture updated");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const currentImageUrl = `${apiBase}/uploads/view?key=${encodeURIComponent(avatarKey)}&t=${Date.now()}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-6 md:mb-8">
        <div className="hidden md:block absolute inset-0 -m-8">
          <div className="size-full rounded-[20px] border-2 border-gray-200 absolute" />
        </div>
        <div className="relative size-30 md:size-35">
          <div className="size-full rounded-[10px] border-4 border-white shadow-lg overflow-hidden bg-white">
            {avatarKey ? (
              <Image
                src={currentImageUrl}
                alt="Profile"
                className="size-full object-cover rounded-md"
                width={140}
                height={140}
                unoptimized
              />
            ) : (
              <div className="text-gray-900 flex items-center size-full justify-center">
                No avatar
              </div>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-xl mt-12 md:text-[20px] font-normal text-brand-text">
        {username}
      </h2>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onFile}
      />

      <button
        onClick={() => fileInput.current?.click()}
        className="px-6 py-3 rounded-md border border-transparent bg-gradient-brand bg-clip-border relative group hover:opacity-90 transition-opacity"
      >
        <div className="relative flex items-center gap-2 border dark:border-white dark:bg-transparent bg-white border-black/20 px-4 py-2 rounded-md">
          <span className="text-base font-medium bg-gradient-brand bg-clip-text text-gray-900 dark:text-white">
            Upload picture
          </span>
          <IconUpload />
        </div>
      </button>

      <Dialog.Root open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl z-50 w-full max-w-md">
            <Dialog.Title className="text-lg font-medium mb-4 dark:text-white text-center">
              Crop your profile picture
            </Dialog.Title>

            <div className="flex justify-center bg-black rounded-md overflow-hidden relative group">
              <canvas
                ref={canvasRef}
                onMouseDown={(ev) => {
                  const rect = canvasRef.current!.getBoundingClientRect();
                  setDrag({
                    x: box.x,
                    y: box.y,
                    startX: ev.clientX - rect.left,
                    startY: ev.clientY - rect.top,
                  });
                }}
                onMouseMove={(ev) => {
                  if (!drag || !imgEl) return;
                  const rect = canvasRef.current!.getBoundingClientRect();
                  const nx = Math.max(
                    0,
                    Math.min(
                      imgEl.width - box.size,
                      drag.x +
                        (ev.clientX - rect.left - drag.startX) /
                          (rect.width / 320),
                    ),
                  );
                  const ny = Math.max(
                    0,
                    Math.min(
                      imgEl.height - box.size,
                      drag.y +
                        (ev.clientY - rect.top - drag.startY) /
                          (rect.height / 320),
                    ),
                  );
                  setBox({ ...box, x: Math.floor(nx), y: Math.floor(ny) });
                }}
                onMouseUp={() => setDrag(null)}
                className="cursor-grab active:cursor-grabbing max-w-full"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setPreviewUrl(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 px-4 py-2 dark:via-none dark:text-gray-950 bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] text-white rounded-md disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Save Picture"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

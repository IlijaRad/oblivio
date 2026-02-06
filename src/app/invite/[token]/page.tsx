"use client";

import { invite } from "@/lib/actions/friends/invite";
import Logo from "@/ui/forms/logo";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = useState("Using invite...");

  useEffect(() => {
    if (!token) return;

    const acceptInvite = async () => {
      const result = await invite(token);

      if (result.success) {
        setStatus("ok");
        setMessage("Friend request sent!");
        setTimeout(() => router.push("/"), 1600);
      } else {
        setStatus("error");
        setMessage(result.error || "Invite invalid or expired");
      }
    };

    acceptInvite();
  }, [token, router]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-100 bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-xl border border-black/5 dark:border-white/5 text-center">
        <div className="flex justify-center mb-10">
          <Logo />
        </div>

        <h2 className="text-2xl font-medium text-gray-950 dark:text-white mb-4">
          Invite
        </h2>

        <div
          className={`text-sm py-3 px-4 rounded-md transition-colors ${
            status === "error"
              ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
          } ${status === "ok" ? "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400" : ""}`}
        >
          {message}
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push("/")}
            className="w-full h-11 bg-[linear-gradient(87.89deg,#944C16_0%,#0D0D0F_40.75%)] text-white rounded-md font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Oblivio App
      </div>
    </div>
  );
}

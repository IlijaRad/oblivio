"use client";

import {
  activateLicense,
  CurrentLicense,
  getCurrentLicense,
} from "@/lib/actions/licenses/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Input from "../components/input";
import Label from "../components/label";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function LicenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [current, setCurrent] = useState<CurrentLicense | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [activating, setActivating] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const [token, setToken] = useState(() =>
    (searchParams.get("token") || "").trim(),
  );

  async function loadCurrent() {
    setLoadingCurrent(true);
    setError("");
    const result = await getCurrentLicense();
    if (!result) {
      setCurrent(null);
    } else if ("error" in result) {
      setError(result.error);
    } else {
      setCurrent(result);
    }
    setLoadingCurrent(false);
  }

  useEffect(() => {
    let ignore = false;

    async function fetchOnce() {
      if (ignore) return;
      setLoadingCurrent(true);
      setError("");
      const result = await getCurrentLicense();
      if (ignore) return;

      if (!result) {
        setCurrent(null);
      } else if ("error" in result) {
        setError(result.error);
      } else {
        setCurrent(result);
      }
      setLoadingCurrent(false);
    }

    fetchOnce();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleActivate() {
    if (!token.trim()) {
      setError("Please enter a token");
      return;
    }
    setActivating(true);
    setError("");
    setInfo("");

    const result = await activateLicense(token);

    if ("error" in result) {
      setError(result.error);
      setActivating(false);
      return;
    }

    setInfo(`License activated. Expires: ${formatDate(result.expiresAt)}`);
    await loadCurrent();
    setTimeout(() => router.replace("/"), 900);
    setActivating(false);
  }

  const isActive = !!current;

  return (
    <div className="mt-7.5 flex flex-col gap-6">
      <div className="rounded-md border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Status
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              isActive
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-red-500/15 text-red-600 dark:text-red-400"
            }`}
          >
            {isActive ? "ACTIVE" : "NO LICENSE"}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          An active license is required to use the application.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Loaded: {loadingCurrent ? "..." : "done"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Activated: {formatDate(current?.activatedAt)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Expires: {formatDate(current?.expiresAt)}
        </p>
      </div>

      <div>
        <Label htmlFor="license-token">Activation token</Label>
        <Input
          id="license-token"
          name="license-token"
          className="mt-2"
          placeholder="Paste activation token..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {info && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {info} Redirecting to chat...
        </p>
      )}

      <button
        type="button"
        onClick={handleActivate}
        disabled={activating}
        className="font-medium dark:text-gray-950 py-3 px-4  flex-1 dark:via-none bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] cursor-pointer rounded-md bg-gray-900 px-3.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {activating ? "Activating..." : "Activate license"}
      </button>
      <div className="flex gap-2 w-full">
        <button
          type="button"
          onClick={loadCurrent}
          disabled={loadingCurrent}
          className="h-11 px-4 w-full rounded-md border border-black/10 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => router.replace("/")}
          className="h-11 px-4 w-full rounded-md text-sm text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          Open chat
        </button>
      </div>
    </div>
  );
}

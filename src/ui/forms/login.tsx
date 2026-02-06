"use client";

import { login } from "@/lib/actions/auth/login";
import { FormState } from "@/lib/definitions";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useActionState, useState } from "react";
import IconButton from "../components/icon-button";
import Input from "../components/input";
import Label from "../components/label";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    login,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-7.5">
      <div>
        <Label htmlFor="email">Username or Email</Label>
        <Input
          id="email"
          name="email"
          className="mt-2"
          required
          placeholder="Type here..."
          defaultValue={state?.inputs?.email}
        />
        {state?.errors?.email && (
          <p
            aria-live="polite"
            className="mt-2 text-xs text-red-600 dark:text-red-400"
          >
            {state.errors.email[0]}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            className="mt-2 pr-14"
            required
            placeholder="Type here..."
          />
          <IconButton
            type="button"
            className="size-11 absolute top-0 right-1 text-gray-500 dark:text-white/70"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </IconButton>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="font-medium dark:text-gray-950 mt-8 h-11 w-full dark:via-none bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] cursor-pointer rounded-md bg-gray-900 px-3.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
      {state?.errors?.server && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {state.errors.server[0]}
        </p>
      )}
    </form>
  );
}

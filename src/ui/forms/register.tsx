"use client";

import { register } from "@/lib/actions/auth/register";
import { FormState } from "@/lib/definitions";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useActionState, useState } from "react";
import IconButton from "../components/icon-button";
import Input from "../components/input";
import Label from "../components/label";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    register,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-7.5">
      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          className="mt-2"
          required
          placeholder="Type here..."
          defaultValue={state?.inputs?.username}
        />
        {state?.errors?.username && (
          <p
            aria-live="polite"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {state.errors.username[0]}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Label htmlFor="email">Email address (optional)</Label>
        <Input
          type="email"
          id="email"
          name="email"
          className="mt-2"
          placeholder="Type here..."
        />
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
        {state?.errors?.password && (
          <p
            aria-live="polite"
            className="mt-1 text-xs text-red-600 dark:text-red-400"
          >
            {state.errors.password[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="font-medium dark:text-gray-950 mt-8 h-11 w-full dark:via-none bg-linear-to-r dark:to-white from-[#944C16] via-[#0D0D0F] via-[40.75%] to-[#0D0D0F] cursor-pointer rounded-md bg-gray-900 px-3.5 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create an account"}
      </button>

      {state?.errors?.server && (
        <p
          aria-live="polite"
          className="mt-4 text-red-600 first-letter:uppercase dark:text-red-400 text-xs"
        >
          {state.errors.server[0]}
        </p>
      )}
    </form>
  );
}

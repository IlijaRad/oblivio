"use client";

import { changeProfileVisibility } from "@/lib/actions/visibility/patch";
import * as Switch from "@radix-ui/react-switch";
import { startTransition, useActionState, useOptimistic } from "react";

export function VisibilityToggle({ initialValue }: { initialValue: boolean }) {
  const [state, formAction] = useActionState(changeProfileVisibility, null);

  const [optimisticValue, setOptimisticValue] = useOptimistic(
    initialValue,
    (_, newValue: boolean) => newValue,
  );

  const handleCheckedChange = (checked: boolean) => {
    startTransition(() => {
      setOptimisticValue(checked);

      const formData = new FormData();
      formData.append("visibility", String(checked));
      formAction(formData);
    });
  };

  return (
    <div className="flex flex-col items-end">
      <form>
        <Switch.Root
          checked={optimisticValue}
          onCheckedChange={handleCheckedChange}
          className="bg-[linear-gradient(87.89deg,#944C16_0%,#0D0D0F_40.75%)] dark:bg-none dark:bg-white rounded-full w-10 h-6.25"
        >
          <Switch.Thumb className="block size-5.25 bg-white dark:bg-gray-900 rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4.25" />
        </Switch.Root>
      </form>

      {state?.errors?.server && (
        <p className="text-[10px] text-red-500 absolute mt-7">
          {state.errors.server[0]}
        </p>
      )}
    </div>
  );
}

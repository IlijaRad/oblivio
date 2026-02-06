import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

export default function Input({ ref, ...props }: ComponentProps<"input">) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      ref={ref}
      className={twMerge(
        "block h-11 w-full dark:placeholder-[#989898] dark:text-white rounded-md border dark:bg-[#282828] dark:border-[#bababa] border-black/20 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-800/50",
        className,
      )}
    />
  );
}

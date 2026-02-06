import { Root } from "@radix-ui/react-slot";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type IconButtonProps = ComponentProps<"button"> & {
  asChild?: boolean;
};

export default function IconButton({
  asChild = false,
  children,
  className,
  ...restProps
}: IconButtonProps) {
  const Component = asChild ? Root : "button";

  return (
    <Component
      className={twMerge(
        "flex size-12 cursor-pointer items-center justify-center rounded-md",
        className,
      )}
      {...restProps}
    >
      {children}
    </Component>
  );
}

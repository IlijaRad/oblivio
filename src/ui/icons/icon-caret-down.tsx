import { ComponentProps } from "react";

export default function IconCaretDown({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.97672 11.7087C8.31141 11.9797 8.80282 11.9611 9.1136 11.6503L12.5136 8.25031C12.758 8.00594 12.8297 7.64203 12.6969 7.32328C12.5641 7.00453 12.2559 6.8 11.9133 6.8H5.11328C4.77063 6.8 4.45985 7.00719 4.32703 7.32594C4.19422 7.64469 4.2686 8.00859 4.51297 8.25031L7.91297 11.6503L7.97672 11.7087Z"
        fill="currentColor"
      />
    </svg>
  );
}

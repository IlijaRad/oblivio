import { ComponentProps } from "react";

export default function IconCopy({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9 2C7.89687 2 7 2.89687 7 4V12C7 13.1031 7.89687 14 9 14H15C16.1031 14 17 13.1031 17 12V5.73125C17 5.1875 16.7781 4.66562 16.3844 4.2875L14.5813 2.55625C14.2094 2.2 13.7125 2 13.1969 2H9ZM5 6C3.89688 6 3 6.89687 3 8V16C3 17.1031 3.89688 18 5 18H11C12.1031 18 13 17.1031 13 16V15.5H11V16H5V8H5.5V6H5Z"
        fill="url(#paint0_linear_106_730)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_106_730"
          x1="3"
          y1="18"
          x2="8.90884"
          y2="17.8096"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="[stop-color:#944C16] dark:[stop-color:#fff]" />
          <stop
            offset="1"
            className="[stop-color:#0D0D0F] dark:[stop-color:#fff]"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

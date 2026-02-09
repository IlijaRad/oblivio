import { ComponentProps } from "react";

export default function IconUser({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M11 10.725C13.279 10.725 15.125 8.87906 15.125 6.6C15.125 4.32094 13.279 2.475 11 2.475C8.72091 2.475 6.87498 4.32094 6.87498 6.6C6.87498 8.87906 8.72091 10.725 11 10.725ZM9.97904 12.65C6.5931 12.65 3.84998 15.3931 3.84998 18.7791C3.84998 19.3428 4.30716 19.8 4.87091 19.8H17.129C17.6928 19.8 18.15 19.3428 18.15 18.7791C18.15 15.3931 15.4068 12.65 12.0209 12.65H9.97904Z"
        fill="url(#paint0_linear_user)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_user"
          x1="3.84998"
          y1="19.8"
          x2="9.88612"
          y2="19.6165"
          gradientUnits="userSpaceOnUse"
        >
          <stop className="[stop-color:#944c16] dark:[stop-color:#fff]" />
          <stop
            offset="1"
            className="[stop-color:#0D0D0F] dark:[stop-color:#fff]"
          />
        </linearGradient>
      </defs>
    </svg>
  );
}

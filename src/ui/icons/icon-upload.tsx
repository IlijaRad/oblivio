import { ComponentProps } from "react";

export default function IconUpload({ ...props }: ComponentProps<"svg">) {
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
        d="M11 5.41564V12C11 12.5531 10.5531 13 10 13C9.44688 13 9 12.5531 9 12V5.41564L7.70625 6.70939C7.31563 7.10001 6.68125 7.10001 6.29063 6.70939C5.9 6.31876 5.9 5.68439 6.29063 5.29376L9.29062 2.29376C9.68125 1.90314 10.3156 1.90314 10.7063 2.29376L13.7063 5.29376C14.0969 5.68439 14.0969 6.31876 13.7063 6.70939C13.3156 7.10001 12.6812 7.10001 12.2906 6.70939L11 5.41564ZM10 14.5C11.3813 14.5 12.5 13.3813 12.5 12H15C16.1031 12 17 12.8969 17 14V15C17 16.1031 16.1031 17 15 17H5C3.89688 17 3 16.1031 3 15V14C3 12.8969 3.89688 12 5 12H7.5C7.5 13.3813 8.61875 14.5 10 14.5ZM14.5 15.25C14.9156 15.25 15.25 14.9156 15.25 14.5C15.25 14.0844 14.9156 13.75 14.5 13.75C14.0844 13.75 13.75 14.0844 13.75 14.5C13.75 14.9156 14.0844 15.25 14.5 15.25Z"
        fill="url(#paint0_linear_246_3346)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_246_3346"
          x1="3"
          y1="17"
          x2="8.908"
          y2="16.797"
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

import { ComponentProps } from "react";

export default function IconMoon({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.8 0C3.93938 0 0 3.93938 0 8.8C0 13.6606 3.93938 17.6 8.8 17.6C11.165 17.6 13.3134 16.665 14.8947 15.1456C15.1456 14.905 15.2178 14.5303 15.0769 14.2141C14.9359 13.8978 14.6059 13.7019 14.2587 13.7294C14.0903 13.7431 13.9219 13.75 13.75 13.75C10.2575 13.75 7.425 10.9175 7.425 7.425C7.425 4.94656 8.85156 2.79813 10.9347 1.76C11.2475 1.60531 11.4263 1.26844 11.385 0.92125C11.3438 0.574063 11.0894 0.292188 10.7491 0.216563C10.12 0.0756251 9.46688 0 8.8 0Z"
        fill="url(#paint0_linear_33_41)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_33_41"
          x1="0"
          y1="17.6"
          x2="6.39361"
          y2="17.3974"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#944C16" />
          <stop offset="1" stopColor="#0D0D0F" />
        </linearGradient>
      </defs>
    </svg>
  );
}

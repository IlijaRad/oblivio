import { ComponentProps } from "react";

export default function AvatarBorder({ ...props }: ComponentProps<"svg">) {
  return (
    <svg
      width="163"
      height="159"
      viewBox="0 0 163 159"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        opacity="0.5"
        x="0.25"
        y="0.25"
        width="161.887"
        height="158.052"
        rx="30.75"
        stroke="#989898"
        strokeWidth="0.5"
      />
      <rect
        x="9.20117"
        y="9.2005"
        width="143.986"
        height="140.151"
        rx="24.75"
        stroke="#989898"
        strokeWidth="0.5"
      />
      <rect
        x="18.4004"
        y="18.401"
        width="125.585"
        height="121.75"
        rx="19.5"
        stroke="#989898"
      />
      <rect
        x="27.8496"
        y="27.8515"
        width="106.685"
        height="102.849"
        rx="13"
        stroke="#989898"
        strokeWidth="2"
      />
    </svg>
  );
}

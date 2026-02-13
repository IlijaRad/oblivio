"use client";

import { useEffect, useRef, useState } from "react";

interface BurnButtonProps {
  onClick: () => void;
}

const GAP = 6;

export default function BurnButton({ onClick }: BurnButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () => {
      if (buttonRef.current) {
        const { width, height } = buttonRef.current.getBoundingClientRect();
        setRect({ w: Math.round(width), h: Math.round(height) });
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const pad = GAP;
  const svgW = rect.w + pad * 2;
  const svgH = rect.h + pad * 2;
  const rx = GAP + 7;

  const perimeter =
    rect.w > 0
      ? 2 * (rect.w + pad * 2 - rx * 2) +
        2 * (rect.h + pad * 2 - rx * 2) +
        2 * Math.PI * rx
      : 0;

  const dashArray = "6 5";
  const dashUnit = 11;
  const dashoffsetEnd = -Math.round(perimeter / dashUnit) * dashUnit;

  return (
    <div className="relative w-fit mx-auto flex mt-4" style={{ padding: pad }}>
      {rect.w > 0 && (
        <svg
          width={svgW}
          height={svgH}
          className="absolute inset-0 pointer-events-none overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            x={1}
            y={1}
            width={svgW - 2}
            height={svgH - 2}
            rx={rx}
            ry={rx}
            fill="none"
            stroke="rgba(255,110,50,0.85)"
            strokeWidth="1.5"
            strokeDasharray={dashArray}
            strokeLinecap="round"
            style={{
              animation: "spin-dash 7.5s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin-dash {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: ${dashoffsetEnd}; }
            }
          `}</style>
        </svg>
      )}

      <button
        ref={buttonRef}
        onClick={onClick}
        className="relative flex items-center gap-2 px-3 py-2 rounded-md font-medium text-white cursor-pointer select-none transition-all duration-150 active:scale-95"
        style={{
          background:
            "linear-gradient(113.26deg, #C92100 -2.42%, rgba(201, 33, 0, 0.3) 26.51%, #C92100 58.37%)",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.61836 1.41C9.96711 1.1175 10.4809 1.12875 10.8146 1.44375C11.2759 1.87875 11.6884 2.35875 12.0859 2.84625C12.5921 3.465 13.1996 4.2825 13.7846 5.25375C13.9796 4.99875 14.1596 4.77375 14.3171 4.5825C14.3584 4.53375 14.3996 4.48125 14.4409 4.42875C14.7371 4.06125 15.1046 3.6 15.5959 3.6C16.0984 3.6 16.4509 4.04625 16.7509 4.42875C16.7996 4.4925 16.8484 4.5525 16.8971 4.60875C17.2834 5.07375 17.7971 5.745 18.3109 6.57375C19.3309 8.22 20.3959 10.5637 20.3959 13.1962C20.3959 17.835 16.6346 21.5962 11.9959 21.5962C7.35711 21.5962 3.59961 17.8387 3.59961 13.2C3.59961 9.78375 5.14086 6.825 6.61836 4.7625C7.36461 3.72375 8.10711 2.89125 8.66586 2.32125C8.97336 2.00625 9.28461 1.695 9.62211 1.41375L9.61836 1.41ZM12.0634 18C13.0121 18 13.8521 17.7375 14.6434 17.2125C16.2221 16.11 16.6459 13.905 15.6971 12.1725C15.5284 11.835 15.0971 11.8125 14.8534 12.0975L13.9084 13.1962C13.6609 13.4812 13.2146 13.4737 12.9821 13.1775C12.3334 12.3487 11.1409 10.8375 10.5334 10.065C10.3309 9.80625 9.96336 9.765 9.72711 9.99375C9.04086 10.6612 7.79586 12.1237 7.79586 13.905C7.79586 16.4775 9.69336 18 12.0596 18H12.0634Z"
            fill="white"
          />
        </svg>
        Burn
      </button>
    </div>
  );
}

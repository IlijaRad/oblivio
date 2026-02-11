import { useEffect } from "react";

export default function useCancelOnOutsideTap({
  isRecording,
  handleTouchEnd,
  buttonRef,
}: {
  isRecording: boolean;
  handleTouchEnd: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    const handleOutsideTap = (e: TouchEvent | MouseEvent) => {
      if (!isRecording) return;

      const target = e.target as Node;
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        handleTouchEnd();
      }
    };

    document.addEventListener("touchstart", handleOutsideTap, {
      capture: true,
    });

    return () => {
      document.removeEventListener("touchstart", handleOutsideTap, {
        capture: true,
      });
    };
  }, [isRecording, handleTouchEnd, buttonRef]);
}

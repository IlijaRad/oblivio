"use client";

import { calls } from "@/lib/calls";
import {
  IconArrowsMaximize,
  IconArrowsMinimize,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoneOff,
  IconScreenShare,
  IconScreenShareOff,
  IconVideo,
  IconVideoOff,
} from "@tabler/icons-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useCall } from "./call-provider";
import IncomingCall from "./incoming-call";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CallOverlay({
  getCallerName,
}: {
  getCallerName?: (userId: string) => string;
}) {
  const { callState, incoming, setIncoming, remoteRef, localRef } = useCall();
  const isClient = useIsClient();
  const [callFullscreen, setCallFullscreen] = useState(true);
  const [position, setPosition] = useState(() => ({
    x: typeof window !== "undefined" ? window.innerWidth - 336 : 0,
    y: typeof window !== "undefined" ? window.innerHeight - 256 : 0,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || callFullscreen) return;
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;

      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 240;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || callFullscreen) return;
      e.preventDefault();
      const touch = e.touches[0];
      const newX = touch.clientX - dragStartRef.current.x;
      const newY = touch.clientY - dragStartRef.current.y;

      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 240;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [callFullscreen, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (callFullscreen) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (callFullscreen) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  };

  if (!isClient) return null;

  const callerName = incoming
    ? (getCallerName?.(incoming.fromUserId) ?? incoming.fromUserId)
    : "";

  const activeCallerName = callState.withUserId
    ? (getCallerName?.(callState.withUserId) ?? callState.withUserId)
    : "";

  return (
    <>
      {incoming &&
        createPortal(
          <IncomingCall
            type={incoming.hasVideo ? "video" : "audio"}
            callerName={callerName}
            onAccept={async () => {
              try {
                await calls.acceptOffer(incoming);
                setIncoming(null);

                setTimeout(() => {
                  remoteRef.current?.play().catch(() => {});
                  localRef.current?.play().catch(() => {});
                }, 100);
              } catch (e) {
                const err = e as DOMException;
                if (err?.name === "NotReadableError") {
                  toast.error(
                    "Microphone is in use by another app. Please close it and try again.",
                  );
                } else if (err?.name === "NotAllowedError") {
                  toast.error("Microphone permission denied.");
                } else {
                  toast.error("Failed to accept call");
                }
                setIncoming(null);
              }
            }}
            onReject={async () => {
              try {
                await calls.rejectCall(incoming.callId, incoming.fromUserId);
              } catch (e) {
                console.error("Failed to send rejection:", e);
              }
              setIncoming(null);
            }}
            onToggle={() => {}}
          />,
          document.body,
        )}

      {callState.active &&
        createPortal(
          <div
            ref={dragRef}
            role="dialog"
            aria-modal="true"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={
              callFullscreen
                ? "fixed inset-0 bg-black z-2000 flex flex-col"
                : "fixed w-80 h-60 bg-black z-2000 flex flex-col rounded-xl border-2 border-white/30"
            }
            style={
              callFullscreen
                ? undefined
                : {
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? "grabbing" : "grab",
                  }
            }
          >
            <div className="relative w-full h-full">
              <video
                ref={(el) => {
                  if (el && remoteRef.current !== el) {
                    remoteRef.current = el;
                    calls.attachElements(el, localRef.current ?? undefined);
                  }
                }}
                autoPlay
                playsInline
                className={
                  callFullscreen
                    ? "absolute inset-0 w-full h-full object-cover"
                    : "absolute inset-0 w-full h-full object-cover rounded-xl"
                }
              />
              {callFullscreen && (
                <video
                  ref={(el) => {
                    if (el && localRef.current !== el) {
                      localRef.current = el;
                      calls.attachElements(remoteRef.current!, el);
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute right-4 bottom-20 w-40 h-30 object-cover rounded-lg transition-opacity duration-200 ${
                    callState.hasVideo || callState.isScreenSharing
                      ? "opacity-100 border-2 border-white/60"
                      : "opacity-0 pointer-events-none border-0"
                  }`}
                />
              )}

              <div className="absolute top-4 left-4 text-white bg-black/40 px-3 py-2 rounded-lg">
                <div>{callState.connected ? "Connected" : "Calling..."}</div>
                <div className="text-sm opacity-80">{activeCallerName}</div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCallFullscreen((v) => !v);
                }}
                className="absolute top-4 right-4 bg-black/60 border border-white/30 text-white rounded-lg px-3 py-2 text-lg cursor-pointer hover:bg-black/80"
                title={callFullscreen ? "Minimize" : "Fullscreen"}
              >
                {callFullscreen ? (
                  <IconArrowsMinimize />
                ) : (
                  <IconArrowsMaximize />
                )}
              </button>

              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-6">
                <button
                  onClick={() => calls.toggleMic()}
                  className={`p-4 rounded-full ${callState.micMuted ? "bg-red-500" : "bg-gray-700"} text-white`}
                  title={callState.micMuted ? "Unmute" : "Mute"}
                >
                  {callState.micMuted ? (
                    <IconMicrophoneOff size={20} />
                  ) : (
                    <IconMicrophone size={20} />
                  )}
                </button>

                {callState.hasVideo && (
                  <button
                    onClick={() => calls.toggleCamera()}
                    className={`p-4 rounded-full ${callState.cameraOn ? "bg-gray-700" : "bg-red-500"} text-white`}
                    title={callState.cameraOn ? "Camera Off" : "Camera On"}
                  >
                    {callState.cameraOn ? (
                      <IconVideo size={20} />
                    ) : (
                      <IconVideoOff size={20} />
                    )}
                  </button>
                )}

                {typeof navigator !== "undefined" &&
                  "getDisplayMedia" in navigator.mediaDevices && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        callState.isScreenSharing
                          ? calls.stopScreenShare()
                          : calls.startScreenShare();
                      }}
                      className={`p-4 rounded-full ${callState.isScreenSharing ? "bg-blue-600" : "bg-gray-700"} text-white`}
                      title={
                        callState.isScreenSharing
                          ? "Stop Sharing"
                          : "Share Screen"
                      }
                    >
                      {callState.isScreenSharing ? (
                        <IconScreenShareOff size={20} />
                      ) : (
                        <IconScreenShare size={20} />
                      )}
                    </button>
                  )}

                <button
                  onClick={() => calls.endCall("hangup")}
                  className="p-4 rounded-full bg-red-600 text-white"
                  title="End Call"
                >
                  <IconPhoneOff size={20} />
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
